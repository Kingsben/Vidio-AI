import { describe, expect, it } from 'vitest'
import {
  assertGenerationStatusTransition,
  canTransitionGenerationStatus,
} from './transitions'

describe('generation status transitions', () => {
  it('allows worker-verified completion and cancellation race outcomes', () => {
    expect(canTransitionGenerationStatus('queued', 'running', 'worker')).toBe(true)
    expect(canTransitionGenerationStatus('running', 'succeeded', 'worker')).toBe(true)
    expect(canTransitionGenerationStatus('cancel_requested', 'succeeded', 'worker')).toBe(true)
    expect(canTransitionGenerationStatus('cancel_requested', 'cancelled', 'worker')).toBe(true)
  })

  it('limits user actions to requesting cancellation', () => {
    expect(canTransitionGenerationStatus('queued', 'cancelled', 'user')).toBe(true)
    expect(canTransitionGenerationStatus('running', 'cancel_requested', 'user')).toBe(true)
    expect(canTransitionGenerationStatus('running', 'succeeded', 'user')).toBe(false)
    expect(() => assertGenerationStatusTransition('queued', 'succeeded', 'user'))
      .toThrowError(expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' }))
  })

  it('keeps terminal states terminal except for system artifact expiration', () => {
    expect(canTransitionGenerationStatus('failed', 'queued', 'system')).toBe(false)
    expect(canTransitionGenerationStatus('cancelled', 'running', 'worker')).toBe(false)
    expect(canTransitionGenerationStatus('succeeded', 'expired', 'system')).toBe(true)
  })
})
