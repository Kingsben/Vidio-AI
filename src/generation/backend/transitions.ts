import type { GenerationJob } from '../contracts'
import { GenerationBackendError } from './errors'

export type GenerationJobStatus = GenerationJob['status']
export type GenerationTransitionActor = 'user' | 'worker' | 'system'

const allowedTransitions: Record<GenerationTransitionActor, ReadonlySet<string>> = {
  user: new Set([
    'queued:cancelled',
    'running:cancel_requested',
  ]),
  worker: new Set([
    'queued:running',
    'running:succeeded',
    'running:failed',
    'running:cancel_requested',
    'cancel_requested:cancelled',
    'cancel_requested:succeeded',
    'cancel_requested:failed',
  ]),
  system: new Set([
    'queued:failed',
    'queued:expired',
    'running:failed',
    'cancel_requested:cancelled',
    'cancel_requested:failed',
    'succeeded:expired',
  ]),
}

export function canTransitionGenerationStatus(
  from: GenerationJobStatus,
  to: GenerationJobStatus,
  actor: GenerationTransitionActor,
): boolean {
  return allowedTransitions[actor].has(`${from}:${to}`)
}

export function assertGenerationStatusTransition(
  from: GenerationJobStatus,
  to: GenerationJobStatus,
  actor: GenerationTransitionActor,
): void {
  if (!canTransitionGenerationStatus(from, to, actor)) {
    throw new GenerationBackendError('INVALID_STATUS_TRANSITION')
  }
}
