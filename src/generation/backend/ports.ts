import type {
  GeneratedVideoArtifact,
  GenerationJob,
  GenerationProgress,
  GenerationRequest,
} from '../contracts'

export interface AuthenticatedPrincipal {
  userId: string
  expiresAt: string
}

export interface AccessTokenVerifier {
  /** Must verify the signature, issuer, audience and expiry with the trusted auth service. */
  verify(token: string): Promise<AuthenticatedPrincipal>
}

export interface ProjectOwnershipAuthorizer {
  /** Returns false for both missing projects and projects owned by another account. */
  isOwnedBy(projectId: string, userId: string): Promise<boolean>
}

export interface GenerationExecutionPlan {
  providerId: string
  modelKey: string
  quotaSeconds: number
}

export interface GenerationExecutionPlanner {
  /** Selects an approved provider and model from server configuration, never from client fields. */
  plan(request: GenerationRequest): Promise<GenerationExecutionPlan | undefined>
}

export interface JobAdmissionCommand {
  userId: string
  request: GenerationRequest
  idempotencyKey: string
  execution: GenerationExecutionPlan
}

export interface JobAdmissionResult {
  disposition: 'created' | 'existing'
  job: GenerationJob
}

export interface GenerationJobAdmissionStore {
  /**
   * Atomically enforces idempotency, per-user concurrency and quota, reserves quota,
   * persists the queued job and its first event, or returns the matching existing job.
   */
  admit(command: JobAdmissionCommand): Promise<JobAdmissionResult>
}

export interface ProviderSubmission {
  providerJobReference: string
  acceptedAt: string
}

export interface ProviderResultReference {
  providerJobReference: string
  privateDownloadReference: string
}

export interface GenerationProviderAdapter {
  readonly providerId: string
  submit(jobId: string, request: GenerationRequest): Promise<ProviderSubmission>
  cancel(providerJobReference: string): Promise<void>
  getResult(providerJobReference: string): Promise<ProviderResultReference | undefined>
}

export interface ClaimedGenerationJob {
  jobId: string
  userId: string
  request: GenerationRequest
  execution: GenerationExecutionPlan
  leaseToken: string
}

export interface GenerationWorkerStore {
  claimNext(workerId: string, leaseSeconds: number): Promise<ClaimedGenerationJob | undefined>
  heartbeat(jobId: string, leaseToken: string, leaseSeconds: number): Promise<boolean>
  isCancellationRequested(jobId: string, leaseToken: string): Promise<boolean>
  recordProgress(jobId: string, leaseToken: string, progress: GenerationProgress): Promise<void>
  recordProviderSubmission(jobId: string, leaseToken: string, submission: ProviderSubmission): Promise<void>
  complete(jobId: string, leaseToken: string, artifact: GeneratedVideoArtifact): Promise<void>
  fail(jobId: string, leaseToken: string, failureCode: string): Promise<void>
  acknowledgeCancellation(jobId: string, leaseToken: string): Promise<void>
  expire(jobId: string, failureCode: string): Promise<void>
}

export interface PrivateArtifactWrite {
  ownerId: string
  jobId: string
  mediaType: 'video/mp4'
  bytes: AsyncIterable<Uint8Array>
}

export interface StoredPrivateArtifact {
  objectKey: string
  fileSizeBytes: number
  sha256: string
}

export interface PrivateArtifactStorage {
  put(write: PrivateArtifactWrite): Promise<StoredPrivateArtifact>
  createDownloadUrl(ownerId: string, objectKey: string, ttlSeconds: number): Promise<string>
  delete(objectKey: string): Promise<void>
}

export interface QuotaSettlement {
  jobId: string
  reservedSeconds: number
  consumedSeconds: number
}

export interface GenerationQuotaLedger {
  /** Called transactionally with terminal job state where the backing store supports it. */
  settle(settlement: QuotaSettlement): Promise<void>
  release(jobId: string, reservedSeconds: number): Promise<void>
}
