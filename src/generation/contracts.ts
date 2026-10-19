import type { ProjectFormat } from '../data/projects'

interface GenerationRequestBase {
  projectId: string
  prompt: string
  negativePrompt?: string
  format: ProjectFormat
  width: number
  height: number
  durationSeconds: number
  seed?: number
}

/** Image conditioning may reference only an application-owned, validated asset ID. */
export type GenerationRequest =
  | (GenerationRequestBase & { mode: 'text-to-video' })
  | (GenerationRequestBase & { mode: 'image-to-video'; inputAssetId: string })

export interface GenerationJobIdentity {
  id: string
  projectId: string
  createdAt: string
  updatedAt: string
}

/** Metadata for an owned generated artifact; it is not an inspiration reference film. */
export interface GeneratedVideoArtifact {
  id: string
  mediaType: 'video/mp4'
  durationSeconds: number
  width: number
  height: number
  hasAudio: boolean
  frameRate: number
  videoCodec: string
  audioCodec?: string
  fileSizeBytes: number
  sha256: string
  expiresAt: string
}

/** Present only when the worker reports actual model/encoding work. */
export interface GenerationProgress {
  stage?: string
  completedSteps?: number
  totalSteps?: number
}

export type GenerationJob =
  | (GenerationJobIdentity & { status: 'queued' })
  | (GenerationJobIdentity & { status: 'running'; progress?: GenerationProgress })
  | (GenerationJobIdentity & { status: 'cancel_requested' })
  | (GenerationJobIdentity & { status: 'succeeded'; artifact: GeneratedVideoArtifact })
  | (GenerationJobIdentity & { status: 'failed'; failureCode: string; message: string })
  | (GenerationJobIdentity & { status: 'cancelled' | 'expired' })

/**
 * Boundary to the authenticated Vidio backend. A browser implementation may call
 * only that same-origin API; provider endpoints and credentials stay server-side.
 * This contract intentionally has no mock implementation or synthetic progress.
 */
export interface GenerationGateway {
  createJob(request: GenerationRequest, idempotencyKey: string): Promise<GenerationJob>
  getJob(jobId: string): Promise<GenerationJob>
  cancelJob(jobId: string): Promise<GenerationJob>
}
