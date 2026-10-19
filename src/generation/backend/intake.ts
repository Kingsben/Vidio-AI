import type { GenerationJob } from '../contracts'
import { GenerationBackendError } from './errors'
import type {
  AccessTokenVerifier,
  GenerationExecutionPlanner,
  GenerationJobAdmissionStore,
  JobAdmissionResult,
  ProjectOwnershipAuthorizer,
} from './ports'
import {
  validateGenerationRequest,
  validateIdempotencyKey,
  type GenerationRequestPolicy,
} from './validation'

export interface GenerationIntakeInput {
  authorization: string | undefined
  idempotencyKey: unknown
  body: unknown
}

export interface GenerationIntakeDependencies {
  tokenVerifier: AccessTokenVerifier
  projectAuthorizer: ProjectOwnershipAuthorizer
  executionPlanner: GenerationExecutionPlanner
  admissionStore: GenerationJobAdmissionStore
  requestPolicy: GenerationRequestPolicy
}

function extractBearerToken(authorization: string | undefined): string {
  if (authorization === undefined || authorization.trim().length === 0) {
    throw new GenerationBackendError('MISSING_AUTHENTICATION')
  }

  const match = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(authorization)
  if (!match) throw new GenerationBackendError('INVALID_AUTHENTICATION')
  return match[1]
}

/**
 * Trusted intake orchestration only. Its adapters must provide real auth, ownership and
 * transactional persistence; this module does not fabricate jobs or submit provider work.
 */
export async function admitGenerationRequest(
  input: GenerationIntakeInput,
  dependencies: GenerationIntakeDependencies,
): Promise<JobAdmissionResult> {
  const token = extractBearerToken(input.authorization)
  let userId: string
  try {
    const principal = await dependencies.tokenVerifier.verify(token)
    userId = principal.userId
  } catch {
    throw new GenerationBackendError('INVALID_AUTHENTICATION')
  }

  const request = validateGenerationRequest(input.body, dependencies.requestPolicy)
  const idempotencyKey = validateIdempotencyKey(input.idempotencyKey)

  if (!await dependencies.projectAuthorizer.isOwnedBy(request.projectId, userId)) {
    throw new GenerationBackendError('PROJECT_ACCESS_DENIED')
  }

  const execution = await dependencies.executionPlanner.plan(request)
  if (!execution) throw new GenerationBackendError('UNSUPPORTED_PROVIDER')
  if (
    execution.providerId.trim().length === 0
    || execution.modelKey.trim().length === 0
    || !Number.isSafeInteger(execution.quotaSeconds)
    || execution.quotaSeconds <= 0
  ) {
    throw new GenerationBackendError('UNSUPPORTED_PROVIDER')
  }

  return dependencies.admissionStore.admit({
    userId,
    request,
    idempotencyKey,
    execution,
  })
}

export type { GenerationJob }
