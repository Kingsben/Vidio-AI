import { describe, expect, it } from 'vitest'
import { GenerationBackendError, toSafeGenerationError } from './errors'

describe('toSafeGenerationError', () => {
  it('returns a fixed public error for expected failures', () => {
    expect(toSafeGenerationError(new GenerationBackendError('QUOTA_EXHAUSTED'), 'request-123'))
      .toEqual({
        status: 429,
        body: {
          error: {
            code: 'QUOTA_EXHAUSTED',
            message: 'The generation quota is exhausted.',
            requestId: 'request-123',
          },
        },
      })
  })

  it('does not expose unexpected error messages, causes or stack traces', () => {
    const response = toSafeGenerationError(new Error('provider token sk-secret leaked'))
    expect(response.status).toBe(500)
    expect(response.body.error).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'The generation service could not complete the request.',
    })
    expect(JSON.stringify(response)).not.toContain('sk-secret')
    expect(JSON.stringify(response)).not.toContain('stack')
  })
})
