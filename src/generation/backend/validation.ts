import type { ProjectFormat } from '../../data/projects'
import type { GeneratedVideoArtifact, GenerationRequest } from '../contracts'
import { GenerationBackendError } from './errors'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{14,126}[A-Za-z0-9]$/

const protectedRequestFields = new Set([
  'artifact',
  'artifactObjectKey',
  'attemptCount',
  'completedAt',
  'createdAt',
  'failureCode',
  'failureMessage',
  'modelKey',
  'ownerId',
  'providerId',
  'providerJobId',
  'quotaReservedSeconds',
  'startedAt',
  'status',
  'updatedAt',
  'userId',
  'workerLeaseExpiresAt',
])

const commonRequestFields = new Set([
  'projectId',
  'prompt',
  'negativePrompt',
  'mode',
  'format',
  'width',
  'height',
  'durationSeconds',
  'seed',
])

export interface GenerationPreset {
  mode: GenerationRequest['mode']
  format: ProjectFormat
  width: number
  height: number
  durationSeconds: number
}

export interface GenerationRequestPolicy {
  presets: readonly GenerationPreset[]
  maxPromptCharacters: number
  maxNegativePromptCharacters: number
  minimumSeed: number
  maximumSeed: number
}

export interface ArtifactValidationPolicy {
  maxFileSizeBytes: number
  maxDurationSeconds: number
  maxWidth: number
  maxHeight: number
  maxFrameRate: number
  requireAudio: boolean
  allowedVideoCodecs: readonly string[]
  allowedAudioCodecs: readonly string[]
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function assertNoProtectedFields(input: Record<string, unknown>): void {
  if (Object.keys(input).some((key) => protectedRequestFields.has(key))) {
    throw new GenerationBackendError('PROTECTED_FIELD')
  }
}

function assertExactFields(input: Record<string, unknown>, allowed: Set<string>): void {
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw new GenerationBackendError('INVALID_REQUEST')
  }
}

function matchesPreset(input: Record<string, unknown>, preset: GenerationPreset): boolean {
  return input.mode === preset.mode
    && input.format === preset.format
    && input.width === preset.width
    && input.height === preset.height
    && input.durationSeconds === preset.durationSeconds
}

/** Parses untrusted JSON using an exact allowlist. It accepts no provider or job-state fields. */
export function validateGenerationRequest(
  value: unknown,
  policy: GenerationRequestPolicy,
): GenerationRequest {
  if (!isPlainRecord(value)) throw new GenerationBackendError('INVALID_REQUEST')
  assertNoProtectedFields(value)

  const mode = value.mode
  if (mode !== 'text-to-video' && mode !== 'image-to-video') {
    throw new GenerationBackendError('UNSUPPORTED_MODE')
  }

  const allowedFields = new Set(commonRequestFields)
  if (mode === 'image-to-video') allowedFields.add('inputAssetId')
  assertExactFields(value, allowedFields)

  if (!policy.presets.some((preset) => matchesPreset(value, preset))) {
    throw new GenerationBackendError('UNSUPPORTED_SETTINGS')
  }

  if (!isUuid(value.projectId)) throw new GenerationBackendError('INVALID_REQUEST')
  if (typeof value.prompt !== 'string') throw new GenerationBackendError('INVALID_REQUEST')
  const prompt = value.prompt.trim()
  if (prompt.length === 0 || prompt.length > policy.maxPromptCharacters) {
    throw new GenerationBackendError('INVALID_REQUEST')
  }
  if (value.negativePrompt !== undefined && typeof value.negativePrompt !== 'string') {
    throw new GenerationBackendError('INVALID_REQUEST')
  }
  const negativePrompt = typeof value.negativePrompt === 'string' ? value.negativePrompt.trim() : undefined
  if (negativePrompt !== undefined && negativePrompt.length > policy.maxNegativePromptCharacters) {
    throw new GenerationBackendError('INVALID_REQUEST')
  }
  if (!isFiniteInteger(value.width) || !isFiniteInteger(value.height)) {
    throw new GenerationBackendError('INVALID_REQUEST')
  }
  if (typeof value.durationSeconds !== 'number' || !Number.isFinite(value.durationSeconds)) {
    throw new GenerationBackendError('INVALID_REQUEST')
  }
  if (value.seed !== undefined && (
    !isFiniteInteger(value.seed)
    || value.seed < policy.minimumSeed
    || value.seed > policy.maximumSeed
  )) {
    throw new GenerationBackendError('INVALID_REQUEST')
  }

  const base = {
    projectId: value.projectId,
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    format: value.format as ProjectFormat,
    width: value.width,
    height: value.height,
    durationSeconds: value.durationSeconds,
    ...(value.seed === undefined ? {} : { seed: value.seed }),
  }

  if (mode === 'text-to-video') return { ...base, mode }
  if (!isUuid(value.inputAssetId)) throw new GenerationBackendError('INVALID_REQUEST')
  return { ...base, mode, inputAssetId: value.inputAssetId }
}

export function validateIdempotencyKey(value: unknown): string {
  if (typeof value !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new GenerationBackendError('INVALID_IDEMPOTENCY_KEY')
  }
  return value
}

/** Validates worker-produced metadata before it can be persisted as a successful output. */
export function validateGeneratedArtifact(
  value: unknown,
  policy: ArtifactValidationPolicy,
  now: Date = new Date(),
): GeneratedVideoArtifact {
  if (!isPlainRecord(value)) throw new GenerationBackendError('INVALID_ARTIFACT')
  const allowedFields = new Set([
    'id',
    'mediaType',
    'durationSeconds',
    'width',
    'height',
    'hasAudio',
    'frameRate',
    'videoCodec',
    'audioCodec',
    'fileSizeBytes',
    'sha256',
    'expiresAt',
  ])
  if (Object.keys(value).some((key) => !allowedFields.has(key))) {
    throw new GenerationBackendError('INVALID_ARTIFACT')
  }

  const expiration = typeof value.expiresAt === 'string' ? new Date(value.expiresAt) : undefined
  const isValid = isUuid(value.id)
    && value.mediaType === 'video/mp4'
    && typeof value.durationSeconds === 'number'
    && Number.isFinite(value.durationSeconds)
    && value.durationSeconds > 0
    && value.durationSeconds <= policy.maxDurationSeconds
    && isFiniteInteger(value.width)
    && value.width > 0
    && value.width <= policy.maxWidth
    && isFiniteInteger(value.height)
    && value.height > 0
    && value.height <= policy.maxHeight
    && typeof value.hasAudio === 'boolean'
    && (!policy.requireAudio || value.hasAudio)
    && typeof value.frameRate === 'number'
    && Number.isFinite(value.frameRate)
    && value.frameRate > 0
    && value.frameRate <= policy.maxFrameRate
    && typeof value.videoCodec === 'string'
    && policy.allowedVideoCodecs.includes(value.videoCodec)
    && (
      (value.hasAudio === true
        && typeof value.audioCodec === 'string'
        && policy.allowedAudioCodecs.includes(value.audioCodec))
      || (value.hasAudio === false && (value.audioCodec === undefined || value.audioCodec === null))
    )
    && isFiniteInteger(value.fileSizeBytes)
    && value.fileSizeBytes > 0
    && value.fileSizeBytes <= policy.maxFileSizeBytes
    && typeof value.sha256 === 'string'
    && SHA256_PATTERN.test(value.sha256)
    && expiration !== undefined
    && Number.isFinite(expiration.getTime())
    && expiration.getTime() > now.getTime()

  if (!isValid || expiration === undefined) {
    throw new GenerationBackendError('INVALID_ARTIFACT')
  }

  return {
    id: value.id as string,
    mediaType: 'video/mp4',
    durationSeconds: value.durationSeconds as number,
    width: value.width as number,
    height: value.height as number,
    hasAudio: value.hasAudio as boolean,
    frameRate: value.frameRate as number,
    videoCodec: value.videoCodec as string,
    ...(typeof value.audioCodec === 'string' ? { audioCodec: value.audioCodec } : {}),
    fileSizeBytes: value.fileSizeBytes as number,
    sha256: value.sha256 as string,
    expiresAt: expiration.toISOString(),
  }
}
