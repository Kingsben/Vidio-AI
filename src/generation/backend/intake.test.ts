import { describe, expect, it, vi } from 'vitest'
import type { GenerationJob } from '../contracts'
import { GenerationBackendError } from './errors'
import { admitGenerationRequest, type GenerationIntakeDependencies } from './intake'
import type { GenerationRequestPolicy } from './validation'

const projectId = '5f5b30a2-805d-4f02-a1ca-52d5206e6e76'
const userId = '4fc37ed5-f38a-43da-af50-17ae30c975a2'

const requestPolicy: GenerationRequestPolicy = {
  presets: [
    { mode: 'text-to-video', format: 'square', width: 512, height: 512, durationSeconds: 2 },
  ],
  maxPromptCharacters: 1_000,
  maxNegativePromptCharacters: 1_000,
  minimumSeed: 0,
  maximumSeed: 4_294_967_295,
}

const body = {
  projectId,
  prompt: 'A paper boat floating in gentle rain.',
  mode: 'text-to-video',
  format: 'square',
  width: 512,
  height: 512,
  durationSeconds: 2,
  seed: 42,
}

const job: GenerationJob = {
  id: '15e71d21-0c83-4a03-98a7-302d6e721579',
  projectId,
  createdAt: '2030-01-01T00:00:00.000Z',
  updatedAt: '2030-01-01T00:00:00.000Z',
  status: 'queued',
}

function dependencies(): GenerationIntakeDependencies {
  return {
    tokenVerifier: {
      verify: vi.fn().mockResolvedValue({ userId, expiresAt: '2030-01-01T01:00:00.000Z' }),
    },
    projectAuthorizer: {
      isOwnedBy: vi.fn().mockResolvedValue(true),
    },
    executionPlanner: {
      plan: vi.fn().mockResolvedValue({
        providerId: 'approved-provider',
        modelKey: 'approved-model',
        quotaSeconds: 120,
      }),
    },
    admissionStore: {
      admit: vi.fn().mockResolvedValue({ disposition: 'created', job }),
    },
    requestPolicy,
  }
}

const input = {
  authorization: 'Bearer valid.jwt.token',
  idempotencyKey: 'request_01JAZB3N7R72G8XWQ6YV',
  body,
}

describe('admitGenerationRequest', () => {
  it('derives ownership and provider selection from trusted adapters', async () => {
    const adapters = dependencies()
    await expect(admitGenerationRequest(input, adapters)).resolves.toEqual({
      disposition: 'created',
      job,
    })
    expect(adapters.admissionStore.admit).toHaveBeenCalledWith({
      userId,
      request: body,
      idempotencyKey: input.idempotencyKey,
      execution: {
        providerId: 'approved-provider',
        modelKey: 'approved-model',
        quotaSeconds: 120,
      },
    })
  })

  it('rejects missing and invalid authentication before admission', async () => {
    const missingAdapters = dependencies()
    await expect(admitGenerationRequest({ ...input, authorization: undefined }, missingAdapters))
      .rejects.toMatchObject({ code: 'MISSING_AUTHENTICATION' })
    expect(missingAdapters.tokenVerifier.verify).not.toHaveBeenCalled()

    const expiredAdapters = dependencies()
    vi.mocked(expiredAdapters.tokenVerifier.verify).mockRejectedValue(new Error('expired'))
    await expect(admitGenerationRequest(input, expiredAdapters))
      .rejects.toMatchObject({ code: 'INVALID_AUTHENTICATION' })
    expect(expiredAdapters.admissionStore.admit).not.toHaveBeenCalled()
  })

  it('returns the same authorization error for missing and foreign projects', async () => {
    const adapters = dependencies()
    vi.mocked(adapters.projectAuthorizer.isOwnedBy).mockResolvedValue(false)
    await expect(admitGenerationRequest(input, adapters))
      .rejects.toMatchObject({ code: 'PROJECT_ACCESS_DENIED' })
    expect(adapters.executionPlanner.plan).not.toHaveBeenCalled()
    expect(adapters.admissionStore.admit).not.toHaveBeenCalled()
  })

  it('rejects protected client fields and unsupported provider plans', async () => {
    const protectedAdapters = dependencies()
    await expect(admitGenerationRequest({
      ...input,
      body: { ...body, status: 'succeeded' },
    }, protectedAdapters)).rejects.toMatchObject({ code: 'PROTECTED_FIELD' })
    expect(protectedAdapters.admissionStore.admit).not.toHaveBeenCalled()

    const unsupportedAdapters = dependencies()
    vi.mocked(unsupportedAdapters.executionPlanner.plan).mockResolvedValue(undefined)
    await expect(admitGenerationRequest(input, unsupportedAdapters))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_PROVIDER' })
  })

  it('returns a persisted duplicate without submitting provider work', async () => {
    const adapters = dependencies()
    vi.mocked(adapters.admissionStore.admit).mockResolvedValue({ disposition: 'existing', job })
    await expect(admitGenerationRequest(input, adapters)).resolves.toEqual({
      disposition: 'existing',
      job,
    })
    expect(adapters.admissionStore.admit).toHaveBeenCalledTimes(1)
  })

  it('propagates safe quota and idempotency outcomes from the atomic admission store', async () => {
    for (const code of ['QUOTA_EXHAUSTED', 'IDEMPOTENCY_CONFLICT'] as const) {
      const adapters = dependencies()
      vi.mocked(adapters.admissionStore.admit).mockRejectedValue(new GenerationBackendError(code))
      await expect(admitGenerationRequest(input, adapters)).rejects.toMatchObject({ code })
    }
  })
})
