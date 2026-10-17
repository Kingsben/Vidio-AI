import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase'
import {
  isProjectFormat,
  ProjectRepositoryError,
  validateProjectInput,
  type Project,
  type ProjectInput,
  type ProjectRepository,
} from './projects'

const projectColumns = 'id,user_id,title,brief,format,created_at,updated_at'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toProject(row: unknown, userId: string): Project {
  if (
    !isRecord(row) ||
    !('id' in row) ||
    !('user_id' in row) ||
    !('title' in row) ||
    !('brief' in row) ||
    !('format' in row) ||
    !('created_at' in row) ||
    !('updated_at' in row)
  ) {
    throw new ProjectRepositoryError('The saved project returned by the cloud is invalid.')
  }

  const createdAt = typeof row.created_at === 'string' ? Date.parse(row.created_at) : Number.NaN
  const updatedAt = typeof row.updated_at === 'string' ? Date.parse(row.updated_at) : Number.NaN
  if (
    typeof row.id !== 'string' ||
    !row.id ||
    row.user_id !== userId ||
    typeof row.title !== 'string' ||
    !row.title.trim() ||
    typeof row.brief !== 'string' ||
    !isProjectFormat(row.format) ||
    !Number.isFinite(createdAt) ||
    !Number.isFinite(updatedAt)
  ) {
    throw new ProjectRepositoryError('The saved project returned by the cloud is invalid.')
  }

  return {
    id: row.id,
    title: row.title,
    brief: row.brief,
    format: row.format,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  }
}

function getErrorDetails(error: unknown) {
  if (typeof error !== 'object' || error === null) return {}
  const value = error as { code?: unknown; status?: unknown; name?: unknown; message?: unknown }
  return {
    code: typeof value.code === 'string' ? value.code : undefined,
    status: typeof value.status === 'number' ? value.status : undefined,
    name: typeof value.name === 'string' ? value.name : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
  }
}

function isNetworkFailure(error: unknown) {
  const details = getErrorDetails(error)
  return error instanceof TypeError ||
    details.status === 0 ||
    details.name === 'AuthRetryableFetchError' ||
    /network|fetch failed/i.test(details.message ?? '')
}

function operationError(operation: 'auth' | 'load' | 'create' | 'update' | 'delete', cause?: unknown) {
  const details = getErrorDetails(cause)
  if (operation === 'auth') {
    return new ProjectRepositoryError(
      isNetworkFailure(cause)
        ? 'Could not verify your sign-in because of a network problem. Check your connection and try again.'
        : 'Your authenticated session is no longer valid. Sign in again to access cloud projects.',
      cause === undefined ? undefined : { cause },
    )
  }
  if (details.code === '42501' || details.status === 403) {
    return new ProjectRepositoryError(
      'Your account does not have permission to make this change. Contact support if you believe this is an error.',
      cause === undefined ? undefined : { cause },
    )
  }
  if (details.status === 401) {
    return new ProjectRepositoryError(
      'Your authenticated session has expired. Sign in again and retry this operation.',
      cause === undefined ? undefined : { cause },
    )
  }
  if (isNetworkFailure(cause)) {
    return new ProjectRepositoryError(
      'A network problem prevented this operation. Check your connection and try again.',
      cause === undefined ? undefined : { cause },
    )
  }
  if (details.code === 'PGRST116' || details.status === 404) {
    return new ProjectRepositoryError('This project is no longer available to your account.')
  }

  const messages = {
    load: 'Could not load your cloud projects. Check your connection and try again.',
    create: 'Could not save this project to your account. Check your connection and try again.',
    update: 'Could not update this project. Please try again.',
    delete: 'Could not delete this project. It may no longer be available to your account.',
  }
  return new ProjectRepositoryError(messages[operation], cause === undefined ? undefined : { cause })
}

export class SupabaseProjectRepository implements ProjectRepository {
  private readonly client: SupabaseClient<Database>
  private readonly userId: string

  constructor(client: SupabaseClient<Database>, userId: string) {
    if (!userId.trim()) throw new ProjectRepositoryError('Sign in to access cloud projects.')
    this.client = client
    this.userId = userId
  }

  private async requireAuthenticatedUser(): Promise<void> {
    let result
    try {
      result = await this.client.auth.getUser()
    } catch (cause) {
      throw operationError('auth', cause)
    }
    const { data, error } = result
    if (error) throw operationError('auth', error)
    if (data.user?.id !== this.userId) {
      throw new ProjectRepositoryError(
        'Your authenticated session is unavailable or has changed. Sign in again to access cloud projects.',
      )
    }
  }

  async list(): Promise<Project[]> {
    try {
      await this.requireAuthenticatedUser()
      const { data, error } = await this.client
        .from('projects')
        .select(projectColumns)
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false })

      if (error) throw operationError('load', error)
      if (!data) throw operationError('load')
      return data.map((row) => toProject(row, this.userId))
    } catch (cause) {
      if (cause instanceof ProjectRepositoryError) throw cause
      throw operationError('load', cause)
    }
  }

  async get(id: string): Promise<Project | undefined> {
    try {
      await this.requireAuthenticatedUser()
      const { data, error } = await this.client
        .from('projects')
        .select(projectColumns)
        .eq('id', id)
        .eq('user_id', this.userId)
        .maybeSingle()

      if (error) throw operationError('load', error)
      return data ? toProject(data, this.userId) : undefined
    } catch (cause) {
      if (cause instanceof ProjectRepositoryError) throw cause
      throw operationError('load', cause)
    }
  }

  async create(input: ProjectInput): Promise<Project> {
    const normalizedInput = validateProjectInput(input)
    try {
      await this.requireAuthenticatedUser()
      const { data, error } = await this.client
        .from('projects')
        .insert(normalizedInput)
        .select(projectColumns)
        .single()

      if (error) throw operationError('create', error)
      if (!data) throw operationError('create')
      return toProject(data, this.userId)
    } catch (cause) {
      if (cause instanceof ProjectRepositoryError) throw cause
      throw operationError('create', cause)
    }
  }

  async update(id: string, input: ProjectInput): Promise<Project> {
    const normalizedInput = validateProjectInput(input)
    try {
      await this.requireAuthenticatedUser()
      const { data, error } = await this.client
        .from('projects')
        .update(normalizedInput)
        .eq('id', id)
        .eq('user_id', this.userId)
        .select(projectColumns)
        .maybeSingle()

      if (error) throw operationError('update', error)
      if (!data) throw new ProjectRepositoryError('This project is no longer available to your account.')
      return toProject(data, this.userId)
    } catch (cause) {
      if (cause instanceof ProjectRepositoryError) throw cause
      throw operationError('update', cause)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.requireAuthenticatedUser()
      const { data, error } = await this.client
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId)
        .select('id')
        .maybeSingle()

      if (error) throw operationError('delete', error)
      if (!data) throw operationError('delete')
    } catch (cause) {
      if (cause instanceof ProjectRepositoryError) throw cause
      throw operationError('delete', cause)
    }
  }
}

export async function getCloudProjectRepository(userId: string): Promise<ProjectRepository> {
  if (!userId.trim()) throw new ProjectRepositoryError('Sign in to access cloud projects.')
  const { getSupabaseClient } = await import('../lib/supabase')
  return new SupabaseProjectRepository(getSupabaseClient(), userId)
}
