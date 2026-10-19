import { describe, expect, it } from 'vitest'
import { GenerationBackendError } from './errors'
import {
  validateGeneratedArtifact,
  validateGenerationRequest,
  validateIdempotencyKey,
  type ArtifactValidationPolicy,
  type GenerationRequestPolicy,
} from './validation'

const projectId = '5f5b30a2-805d-4f02-a1ca-52d5206e6e76'
const inputAssetId = '08c9f117-a6a1-42f5-9c65-93f360ece533'

const requestPolicy: GenerationRequestPolicy = {
  presets: [
    { mode: 'text-to-video', format: 'square', width: 512, height: 512, durationSeconds: 2 },
    { mode: 'image-to-video', format: 'portrait', width: 512, height: 768, durationSeconds: 2 },
  ],
  maxPromptCharacters: 1_000,
  maxNegativePromptCharacters: 1_000,
  minimumSeed: 0,
  maximumSeed: 4_294_967_295,
}

const validTextRequest = {
  projectId,
  prompt: '  A paper boat in gentle rain.  ',
  mode: 'text-to-video',
  format: 'square',
  width: 512,
  height: 512,
  durationSeconds: 2,
  seed: 42,
}

describe('validateGenerationRequest', () => {
  it('returns a normalized request matching an exact allowlisted preset', () => {
    expect(validateGenerationRequest(validTextRequest, requestPolicy)).toEqual({
      ...validTextRequest,
      prompt: 'A paper boat in gentle rain.',
    })
  })

  it('accepts an owned-asset identifier only for an allowlisted image-to-video preset', () => {
    expect(validateGenerationRequest({
      projectId,
      inputAssetId,
      prompt: 'Animate the rain.',
      mode: 'image-to-video',
      format: 'portrait',
      width: 512,
      height: 768,
      durationSeconds: 2,
    }, requestPolicy)).toMatchObject({ mode: 'image-to-video', inputAssetId })
  })

  it('rejects server-controlled fields before ordinary unknown fields', () => {
    expect(() => validateGenerationRequest({ ...validTextRequest, userId: projectId }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'PROTECTED_FIELD' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, providerId: 'public-demo' }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'PROTECTED_FIELD' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, extra: true }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'INVALID_REQUEST' }))
  })

  it('rejects unsupported modes and settings rather than coercing them', () => {
    expect(() => validateGenerationRequest({ ...validTextRequest, mode: 'video-to-video' }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'UNSUPPORTED_MODE' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, width: 1024 }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'UNSUPPORTED_SETTINGS' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, durationSeconds: '2' }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'UNSUPPORTED_SETTINGS' }))
  })

  it('rejects malformed IDs, empty prompts, out-of-range seeds and invalid mode fields', () => {
    expect(() => validateGenerationRequest({ ...validTextRequest, projectId: 'not-a-uuid' }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'INVALID_REQUEST' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, prompt: '   ' }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'INVALID_REQUEST' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, seed: -1 }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'INVALID_REQUEST' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, inputAssetId }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'INVALID_REQUEST' }))
    expect(() => validateGenerationRequest({ ...validTextRequest, negativePrompt: 'x'.repeat(1_001) }, requestPolicy))
      .toThrowError(expect.objectContaining({ code: 'INVALID_REQUEST' }))
  })
})

describe('validateIdempotencyKey', () => {
  it('accepts a bounded opaque key and rejects weak or whitespace-bearing values', () => {
    expect(validateIdempotencyKey('request_01JAZB3N7R72G8XWQ6YV')).toBe('request_01JAZB3N7R72G8XWQ6YV')
    expect(() => validateIdempotencyKey('short')).toThrow(GenerationBackendError)
    expect(() => validateIdempotencyKey('request key with spaces'))
      .toThrowError(expect.objectContaining({ code: 'INVALID_IDEMPOTENCY_KEY' }))
  })
})

describe('validateGeneratedArtifact', () => {
  const artifactPolicy: ArtifactValidationPolicy = {
    maxFileSizeBytes: 25 * 1024 * 1024,
    maxDurationSeconds: 5,
    maxWidth: 1_024,
    maxHeight: 1_024,
    maxFrameRate: 60,
    requireAudio: true,
    allowedVideoCodecs: ['h264'],
    allowedAudioCodecs: ['aac'],
  }
  const artifact = {
    id: '1631e7cd-e257-418b-938b-f0bcbd6fa4ec',
    mediaType: 'video/mp4',
    durationSeconds: 2.04,
    width: 512,
    height: 512,
    hasAudio: true,
    frameRate: 24,
    videoCodec: 'h264',
    audioCodec: 'aac',
    fileSizeBytes: 1_234_567,
    sha256: 'a'.repeat(64),
    expiresAt: '2030-01-02T00:00:00.000Z',
  }

  it('accepts bounded MP4 metadata produced by a trusted worker', () => {
    expect(validateGeneratedArtifact(artifact, artifactPolicy, new Date('2030-01-01T00:00:00Z')))
      .toEqual(artifact)
  })

  it('rejects missing audio, invalid hashes, expired artifacts and extra output fields', () => {
    const now = new Date('2030-01-01T00:00:00Z')
    for (const invalid of [
      { ...artifact, hasAudio: false },
      { ...artifact, sha256: 'provider-value' },
      { ...artifact, expiresAt: '2029-12-31T23:59:59Z' },
      { ...artifact, videoCodec: 'unverified' },
      { ...artifact, hasAudio: true, audioCodec: undefined },
      { ...artifact, publicUrl: 'https://example.invalid/output.mp4' },
    ]) {
      expect(() => validateGeneratedArtifact(invalid, artifactPolicy, now))
        .toThrowError(expect.objectContaining({ code: 'INVALID_ARTIFACT' }))
    }
  })
})
