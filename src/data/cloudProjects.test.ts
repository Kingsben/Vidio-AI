import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../lib/supabase'
import { ProjectRepositoryError, type ProjectInput } from './projects'
import { SupabaseProjectRepository } from './cloudProjects'

const userA = 'user-a'
const projectRow = {
  id: 'project-1',
  user_id: userA,
  title: 'Coastal film',
  brief: 'A quiet study of the sea.',
  format: 'landscape',
  created_at: '2026-10-16T12:00:00+00:00',
  updated_at: '2026-10-16T12:00:00+00:00',
}

function createMockClient(responses: unknown[], authenticatedUserId: string | null = userA, authError: Error | null = null) {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'order', 'insert', 'update', 'delete']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args })
      return builder
    }
  }
  builder.maybeSingle = () => Promise.resolve(responses.shift())
  builder.single = () => Promise.resolve(responses.shift())
  builder.then = (
    resolve: (value: unknown) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise.resolve(responses.shift()).then(resolve, reject)
  const getUser = vi.fn(async () => ({
    data: { user: authenticatedUserId ? { id: authenticatedUserId } : null },
    error: authError,
  }))
  const client = {
    auth: { getUser },
    from: vi.fn((table: string) => {
      calls.push({ method: 'from', args: [table] })
      return builder
    }),
  } as unknown as SupabaseClient<Database>
  return { client, calls, getUser }
}

const input: ProjectInput = {
  title: '  Coastal film  ',
  brief: '  A quiet study of the sea.  ',
  format: 'portrait',
}

describe('SupabaseProjectRepository (mocked)', () => {
  it('lists and maps only rows returned for the authenticated owner', async () => {
    const { client, calls } = createMockClient([{ data: [projectRow], error: null }])
    const repository = new SupabaseProjectRepository(client, userA)

    expect(await repository.list()).toEqual([{
      id: projectRow.id,
      title: projectRow.title,
      brief: projectRow.brief,
      format: projectRow.format,
      createdAt: '2026-10-16T12:00:00.000Z',
      updatedAt: '2026-10-16T12:00:00.000Z',
    }])
    expect(calls.filter(({ method }) => method === 'eq')).toContainEqual({ method: 'eq', args: ['user_id', userA] })
  })

  it('scopes reads, inserts, updates, and deletes to the bound user', async () => {
    const { client, calls, getUser } = createMockClient([
      { data: projectRow, error: null },
      { data: projectRow, error: null },
      { data: { id: projectRow.id }, error: null },
    ])
    const repository = new SupabaseProjectRepository(client, userA)

    await repository.get(projectRow.id)
    await repository.update(projectRow.id, input)
    await repository.delete(projectRow.id)

    const ownerFilters = calls.filter(({ method, args }) => method === 'eq' && args[0] === 'user_id')
    expect(ownerFilters).toHaveLength(3)
    expect(ownerFilters.every(({ args }) => args[1] === userA)).toBe(true)
    expect(calls.find(({ method }) => method === 'update')?.args[0]).not.toHaveProperty('user_id')
    expect(getUser).toHaveBeenCalledTimes(3)
  })

  it('updates only permitted fields and accepts database-managed timestamps', async () => {
    const databaseUpdatedAt = '2026-10-17T20:55:00+00:00'
    const { client, calls } = createMockClient([
      { data: { ...projectRow, title: 'Revised coastal film', format: 'portrait', updated_at: databaseUpdatedAt }, error: null },
    ])
    const repository = new SupabaseProjectRepository(client, userA)

    await expect(repository.update(projectRow.id, input)).resolves.toMatchObject({
      title: 'Revised coastal film',
      brief: 'A quiet study of the sea.',
      format: 'portrait',
      updatedAt: '2026-10-17T20:55:00.000Z',
    })
    expect(calls.find(({ method }) => method === 'update')?.args[0]).toEqual({
      title: 'Coastal film',
      brief: 'A quiet study of the sea.',
      format: 'portrait',
    })
    expect(calls.find(({ method }) => method === 'update')?.args[0]).not.toHaveProperty('id')
    expect(calls.find(({ method }) => method === 'update')?.args[0]).not.toHaveProperty('user_id')
    expect(calls.find(({ method }) => method === 'update')?.args[0]).not.toHaveProperty('created_at')
    expect(calls.find(({ method }) => method === 'update')?.args[0]).not.toHaveProperty('updated_at')
  })

  it('omits protected ownership columns on create and normalizes validated input', async () => {
    const { client, calls, getUser } = createMockClient([{ data: { ...projectRow, format: 'portrait' }, error: null }])
    const repository = new SupabaseProjectRepository(client, userA)

    await repository.create(input)

    expect(calls.find(({ method }) => method === 'insert')?.args[0]).toEqual({
      title: 'Coastal film',
      brief: 'A quiet study of the sea.',
      format: 'portrait',
    })
    expect(calls.find(({ method }) => method === 'insert')?.args[0]).not.toHaveProperty('user_id')
    expect(getUser).toHaveBeenCalledOnce()
  })

  it('treats inaccessible rows as unavailable and rejects mismatched returned owners', async () => {
    const inaccessible = new SupabaseProjectRepository(createMockClient([{ data: null, error: null }]).client, userA)
    await expect(inaccessible.get('another-users-project')).resolves.toBeUndefined()

    const mismatched = new SupabaseProjectRepository(createMockClient([
      { data: [{ ...projectRow, user_id: 'user-b' }], error: null },
    ]).client, userA)
    await expect(mismatched.list()).rejects.toThrow('returned by the cloud is invalid')
  })

  it('surfaces database failures as repository errors', async () => {
    const repository = new SupabaseProjectRepository(createMockClient([
      { data: null, error: new Error('network unavailable') },
    ]).client, userA)

    await expect(repository.list()).rejects.toThrow('network problem')
  })

  it('provides safe, differentiated update failures for permissions and missing projects', async () => {
    const permissionDenied = new SupabaseProjectRepository(createMockClient([
      { data: null, error: { code: '42501', message: 'permission denied for table projects; secret details' } },
    ]).client, userA)
    const permissionError = await permissionDenied.update(projectRow.id, input).catch((error: unknown) => error)
    expect(permissionError).toBeInstanceOf(ProjectRepositoryError)
    expect((permissionError as Error).message).toContain('does not have permission')
    expect((permissionError as Error).message).not.toContain('secret details')

    const missing = new SupabaseProjectRepository(createMockClient([
      { data: null, error: null },
    ]).client, userA)
    await expect(missing.update(projectRow.id, input)).rejects.toThrow('no longer available')
  })

  it('reports a network failure without exposing the transport error', async () => {
    const repository = new SupabaseProjectRepository(createMockClient([
      { data: null, error: new TypeError('fetch failed with private request detail') },
    ]).client, userA)

    try {
      await repository.update(projectRow.id, input)
      expect.fail('Expected update to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectRepositoryError)
      if (!(error instanceof Error)) throw error
      expect(error.message).toContain('network problem')
      expect(error.message).not.toContain('private request detail')
    }
  })

  it('does not accept a blank account identity', () => {
    const { client } = createMockClient([])
    expect(() => new SupabaseProjectRepository(client, '  ')).toThrow('Sign in')
  })

  it('blocks cloud operations when no valid matching authenticated session exists', async () => {
    const noSession = createMockClient([], null)
    const noSessionRepository = new SupabaseProjectRepository(noSession.client, userA)
    await expect(noSessionRepository.list()).rejects.toThrow('authenticated session is unavailable')
    expect(noSession.client.from).not.toHaveBeenCalled()

    const otherSession = createMockClient([], 'user-b')
    const otherSessionRepository = new SupabaseProjectRepository(otherSession.client, userA)
    await expect(otherSessionRepository.create(input)).rejects.toThrow('authenticated session is unavailable')
    expect(otherSession.client.from).not.toHaveBeenCalled()
  })
})
