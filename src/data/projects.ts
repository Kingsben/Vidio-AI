export const projectFormats = ['landscape', 'portrait', 'square'] as const

export type ProjectFormat = (typeof projectFormats)[number]

export interface Project {
  id: string
  title: string
  brief: string
  format: ProjectFormat
  createdAt: string
  updatedAt: string
}

export interface ProjectInput {
  title: string
  brief: string
  format: ProjectFormat
}

export interface ProjectRepository {
  list(): Promise<Project[]>
  get(id: string): Promise<Project | undefined>
  create(input: ProjectInput): Promise<Project>
  update(id: string, input: ProjectInput): Promise<Project>
  delete(id: string): Promise<void>
}

export class ProjectRepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ProjectRepositoryError'
  }
}

const storageKey = 'vidio-ai.projects.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString() === value
}

function isProjectFormat(value: unknown): value is ProjectFormat {
  return typeof value === 'string' && projectFormats.some((format) => format === value)
}

function parseProject(value: unknown): Project {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.title !== 'string' ||
    value.title.trim().length === 0 ||
    typeof value.brief !== 'string' ||
    value.brief.trim().length === 0 ||
    !isProjectFormat(value.format) ||
    !isIsoDate(value.createdAt) ||
    !isIsoDate(value.updatedAt)
  ) {
    throw new ProjectRepositoryError('Saved project data is invalid. It was left unchanged.')
  }

  return {
    id: value.id,
    title: value.title,
    brief: value.brief,
    format: value.format,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function parseProjects(serialized: string | null): Project[] {
  if (serialized === null) return []

  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch (cause) {
    throw new ProjectRepositoryError('Saved project data could not be read because it is malformed.', { cause })
  }

  if (!Array.isArray(value)) {
    throw new ProjectRepositoryError('Saved project data is invalid. It was left unchanged.')
  }

  const projects = value.map(parseProject)
  const ids = new Set(projects.map(({ id }) => id))
  if (ids.size !== projects.length) {
    throw new ProjectRepositoryError('Saved project data contains duplicate identifiers. It was left unchanged.')
  }
  return projects
}

function validateInput(input: ProjectInput): ProjectInput {
  const title = input.title.trim()
  const brief = input.brief.trim()
  if (!title || !brief || !isProjectFormat(input.format)) {
    throw new ProjectRepositoryError('Add a project title, a brief, and a valid video format.')
  }
  return { title, brief, format: input.format }
}

export class LocalProjectRepository implements ProjectRepository {
  private readonly storage: Storage
  private readonly now: () => string
  private readonly createId: () => string

  constructor(
    storage: Storage,
    now: () => string = () => new Date().toISOString(),
    createId: () => string = () => crypto.randomUUID(),
  ) {
    this.storage = storage
    this.now = now
    this.createId = createId
  }

  async list(): Promise<Project[]> {
    return this.read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string): Promise<Project | undefined> {
    return this.read().find((project) => project.id === id)
  }

  async create(input: ProjectInput): Promise<Project> {
    const normalizedInput = validateInput(input)
    const projects = this.read()
    const id = this.createId()
    if (!id || projects.some((project) => project.id === id)) {
      throw new ProjectRepositoryError('A unique project identifier could not be created. Please try again.')
    }
    const createdAt = this.now()
    const project: Project = { id, ...normalizedInput, createdAt, updatedAt: createdAt }
    this.write([...projects, project])
    return project
  }

  async update(id: string, input: ProjectInput): Promise<Project> {
    const normalizedInput = validateInput(input)
    const projects = this.read()
    const index = projects.findIndex((project) => project.id === id)
    if (index < 0) throw new ProjectRepositoryError('This project no longer exists.')

    const updated: Project = { ...projects[index], ...normalizedInput, updatedAt: this.now() }
    projects[index] = updated
    this.write(projects)
    return updated
  }

  async delete(id: string): Promise<void> {
    const projects = this.read()
    if (!projects.some((project) => project.id === id)) {
      throw new ProjectRepositoryError('This project no longer exists.')
    }
    this.write(projects.filter((project) => project.id !== id))
  }

  private read(): Project[] {
    let serialized: string | null
    try {
      serialized = this.storage.getItem(storageKey)
    } catch (cause) {
      throw new ProjectRepositoryError('Could not read projects from this browser.', { cause })
    }
    return parseProjects(serialized)
  }

  private write(projects: Project[]): void {
    try {
      this.storage.setItem(storageKey, JSON.stringify(projects))
    } catch (cause) {
      throw new ProjectRepositoryError('Could not save projects in this browser. Check available storage and try again.', { cause })
    }
  }
}

let browserRepository: ProjectRepository | undefined

export function getProjectRepository(): ProjectRepository {
  if (!browserRepository) {
    try {
      browserRepository = new LocalProjectRepository(window.localStorage)
    } catch (cause) {
      throw new ProjectRepositoryError('Browser storage is unavailable. Check your browser privacy settings.', { cause })
    }
  }
  return browserRepository
}
