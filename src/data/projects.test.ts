import { describe, expect, it } from 'vitest'
import { LocalProjectRepository, ProjectRepositoryError } from './projects'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()
  failWrites = false

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('QuotaExceededError')
    this.values.set(key, value)
  }
}

describe('LocalProjectRepository', () => {
  it('creates, lists, updates, deletes, and reloads saved projects', async () => {
    const storage = new MemoryStorage()
    let timestamp = '2026-10-16T12:00:00.000Z'
    let nextId = 0
    const repository = new LocalProjectRepository(
      storage,
      () => timestamp,
      () => `project-${++nextId}`,
    )

    const project = await repository.create({
      title: '  Coastal film  ',
      brief: '  A quiet study of the sea.  ',
      format: 'landscape',
    })
    expect(project.title).toBe('Coastal film')
    expect(project.brief).toBe('A quiet study of the sea.')
    expect(project.createdAt).toBe(timestamp)

    timestamp = '2026-10-17T12:00:00.000Z'
    const updated = await repository.update(project.id, {
      title: 'Coastal film, revised',
      brief: 'A slower cut with a closer horizon.',
      format: 'portrait',
    })
    expect(updated.id).toBe(project.id)
    expect(updated.createdAt).toBe(project.createdAt)
    expect(updated.updatedAt).toBe(timestamp)
    expect(updated.format).toBe('portrait')

    const reloadedRepository = new LocalProjectRepository(storage, () => timestamp, () => 'unused')
    expect(await reloadedRepository.get(project.id)).toEqual(updated)
    expect(await reloadedRepository.list()).toEqual([updated])

    await reloadedRepository.delete(project.id)
    expect(await reloadedRepository.list()).toEqual([])
  })

  it('rejects empty briefs and unknown formats', async () => {
    const repository = new LocalProjectRepository(new MemoryStorage())
    await expect(repository.create({ title: 'A title', brief: ' ', format: 'square' }))
      .rejects.toThrow(ProjectRepositoryError)
    await expect(repository.create({ title: 'A title', brief: 'A brief', format: 'cinema' as never }))
      .rejects.toThrow('valid video format')
  })

  it('reports malformed persisted data instead of silently replacing it', async () => {
    const storage = new MemoryStorage()
    storage.setItem('vidio-ai.projects.v1', '{')
    const repository = new LocalProjectRepository(storage)

    await expect(repository.list()).rejects.toThrow('malformed')
    expect(storage.getItem('vidio-ai.projects.v1')).toBe('{')
  })

  it('surfaces local storage write failures', async () => {
    const storage = new MemoryStorage()
    storage.failWrites = true
    const repository = new LocalProjectRepository(storage)

    await expect(repository.create({ title: 'A title', brief: 'A brief', format: 'square' }))
      .rejects.toThrow('Could not save projects')
  })
})
