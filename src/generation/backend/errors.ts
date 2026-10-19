export const generationBackendErrorCodes = [
  'MISSING_AUTHENTICATION',
  'INVALID_AUTHENTICATION',
  'PROJECT_ACCESS_DENIED',
  'INVALID_REQUEST',
  'PROTECTED_FIELD',
  'UNSUPPORTED_MODE',
  'UNSUPPORTED_SETTINGS',
  'UNSUPPORTED_PROVIDER',
  'INVALID_IDEMPOTENCY_KEY',
  'IDEMPOTENCY_CONFLICT',
  'QUOTA_EXHAUSTED',
  'CONCURRENCY_LIMIT_REACHED',
  'INVALID_STATUS_TRANSITION',
  'INVALID_ARTIFACT',
  'INTERNAL_ERROR',
] as const

export type GenerationBackendErrorCode = (typeof generationBackendErrorCodes)[number]

interface ErrorDefinition {
  status: number
  message: string
}

const errorDefinitions: Record<GenerationBackendErrorCode, ErrorDefinition> = {
  MISSING_AUTHENTICATION: {
    status: 401,
    message: 'Authentication is required.',
  },
  INVALID_AUTHENTICATION: {
    status: 401,
    message: 'The authentication session is invalid or expired.',
  },
  PROJECT_ACCESS_DENIED: {
    status: 403,
    message: 'The project is unavailable or is not owned by this account.',
  },
  INVALID_REQUEST: {
    status: 400,
    message: 'The generation request is invalid.',
  },
  PROTECTED_FIELD: {
    status: 400,
    message: 'The request contains a server-controlled field.',
  },
  UNSUPPORTED_MODE: {
    status: 400,
    message: 'The requested generation mode is not supported.',
  },
  UNSUPPORTED_SETTINGS: {
    status: 400,
    message: 'The requested generation settings are not supported.',
  },
  UNSUPPORTED_PROVIDER: {
    status: 503,
    message: 'No approved generation provider supports this request.',
  },
  INVALID_IDEMPOTENCY_KEY: {
    status: 400,
    message: 'A valid idempotency key is required.',
  },
  IDEMPOTENCY_CONFLICT: {
    status: 409,
    message: 'The idempotency key was already used for a different request.',
  },
  QUOTA_EXHAUSTED: {
    status: 429,
    message: 'The generation quota is exhausted.',
  },
  CONCURRENCY_LIMIT_REACHED: {
    status: 429,
    message: 'The concurrent generation limit has been reached.',
  },
  INVALID_STATUS_TRANSITION: {
    status: 409,
    message: 'The generation job cannot enter the requested state.',
  },
  INVALID_ARTIFACT: {
    status: 422,
    message: 'The generated video did not pass output validation.',
  },
  INTERNAL_ERROR: {
    status: 500,
    message: 'The generation service could not complete the request.',
  },
}

/** A public error with a fixed message; internal causes and prompts never cross the API boundary. */
export class GenerationBackendError extends Error {
  readonly code: GenerationBackendErrorCode
  readonly status: number

  constructor(code: GenerationBackendErrorCode, options?: ErrorOptions) {
    const definition = errorDefinitions[code]
    super(definition.message, options)
    this.name = 'GenerationBackendError'
    this.code = code
    this.status = definition.status
  }
}

export interface SafeGenerationErrorResponse {
  status: number
  body: {
    error: {
      code: GenerationBackendErrorCode
      message: string
      requestId?: string
    }
  }
}

/** Converts all unexpected failures to a stable response without exposing stack traces or causes. */
export function toSafeGenerationError(
  error: unknown,
  requestId?: string,
): SafeGenerationErrorResponse {
  const safeError = error instanceof GenerationBackendError
    ? error
    : new GenerationBackendError('INTERNAL_ERROR')

  return {
    status: safeError.status,
    body: {
      error: {
        code: safeError.code,
        message: safeError.message,
        ...(requestId ? { requestId } : {}),
      },
    },
  }
}
