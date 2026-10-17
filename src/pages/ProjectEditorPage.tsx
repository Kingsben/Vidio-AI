import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { Project, ProjectFormat, ProjectInput } from '../data/projects'
import { getCloudProjectRepository } from '../data/cloudProjects'
import { projectFormats } from '../data/projects'

const formatLabels: Record<ProjectFormat, { title: string; ratio: string }> = {
  landscape: { title: 'Landscape', ratio: '16:9 · widescreen' },
  portrait: { title: 'Portrait', ratio: '9:16 · vertical' },
  square: { title: 'Square', ratio: '1:1 · social' },
}
const formatOptions = projectFormats.map((value) => ({ value, ...formatLabels[value] }))

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong while saving your project.'
}

function ProjectEditorPage() {
  const { session } = useAuth()
  const userId = session?.user.id
  const { projectId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(projectId)
  const [loadResult, setLoadResult] = useState<{ id: string; userId: string; project?: Project; error?: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!projectId || !userId) return
    let isCurrent = true
    void Promise.resolve()
      .then(async () => (await getCloudProjectRepository(userId)).get(projectId))
      .then((savedProject) => {
        if (isCurrent) setLoadResult({ id: projectId, userId, project: savedProject })
      })
      .catch((cause: unknown) => {
        if (isCurrent) setLoadResult({ id: projectId, userId, error: getErrorMessage(cause) })
      })
    return () => {
      isCurrent = false
    }
  }, [projectId, userId])

  const hasCurrentProjectResult = Boolean(projectId && userId && loadResult?.id === projectId && loadResult.userId === userId)
  const isLoading = Boolean(projectId && !hasCurrentProjectResult)
  const project = hasCurrentProjectResult ? loadResult?.project : undefined
  const loadError = hasCurrentProjectResult ? loadResult?.error : undefined

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const selectedFormat = formData.get('format')
    const format = projectFormats.find((option) => option === selectedFormat)
    if (!format) {
      setError('Select a valid video format.')
      return
    }
    const input: ProjectInput = {
      title: String(formData.get('title') ?? ''),
      brief: String(formData.get('brief') ?? ''),
      format,
    }
    if (!userId) {
      setError('Sign in to save cloud projects.')
      return
    }
    setIsSaving(true)
    setError(undefined)
    try {
      if (projectId) {
        const saved = await (await getCloudProjectRepository(userId)).update(projectId, input)
        setLoadResult({ id: saved.id, userId, project: saved })
      } else {
        const saved = await (await getCloudProjectRepository(userId)).create(input)
        navigate(`/app/projects/${encodeURIComponent(saved.id)}`)
      }
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteProject() {
    if (!project || !userId || !window.confirm(`Delete “${project.title}” from your cloud projects?`)) return
    setError(undefined)
    try {
      await (await getCloudProjectRepository(userId)).delete(project.id)
      navigate('/app')
    } catch (cause) {
      setError(getErrorMessage(cause))
    }
  }

  if (isLoading) return <p className="workspace-loading" role="status">Loading project…</p>
  if (loadError && isEditing && !project) {
    return (
      <section className="workspace-empty-state workspace-editor-state" role="alert">
        <p className="eyebrow">PROJECT UNAVAILABLE</p>
        <h1>We couldn’t open this draft.</h1>
        <p>{loadError}</p>
        <Link className="workspace-button workspace-button-secondary" to="/app">Back to projects</Link>
      </section>
    )
  }
  if (isEditing && !project) {
    return (
      <section className="workspace-empty-state workspace-editor-state">
        <p className="eyebrow">DRAFT NOT FOUND</p>
        <h1>This project isn’t saved here.</h1>
        <p>This project is unavailable or does not belong to the signed-in account.</p>
        <Link className="workspace-button workspace-button-secondary" to="/app">Back to projects</Link>
      </section>
    )
  }

  return (
    <div className="project-editor-page">
      <Link className="workspace-breadcrumb" to="/app">Projects <span aria-hidden="true">/</span> {project ? project.title : 'New project'}</Link>
      <div className="workspace-page-heading editor-heading">
        <div>
          <p className="eyebrow">{project ? 'PROJECT BRIEF' : 'NEW PROJECT'}</p>
          <h1>{project ? 'Shape the brief.' : 'Start with an idea.'}</h1>
          <p className="workspace-page-description">
            Keep the essentials together in your account. This saves a project brief, not a generated video.
          </p>
        </div>
        {project && (
          <button className="workspace-button workspace-button-danger" type="button" onClick={() => void deleteProject()}>
            Delete project
          </button>
        )}
      </div>

      <form className="project-form" onSubmit={(event) => void saveProject(event)}>
        <label className="workspace-field">
          <span>Project title</span>
          <input
            name="title"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. A quiet morning in the city"
            defaultValue={project?.title}
            autoComplete="off"
          />
          <span className="field-hint">A working title you can change at any time.</span>
        </label>
        <label className="workspace-field">
          <span>Project brief</span>
          <textarea
            name="brief"
            required
            rows={7}
            maxLength={4000}
            placeholder="Describe the story, mood, or message you want to explore…"
            defaultValue={project?.brief}
          />
          <span className="field-hint">Your brief is saved to your account and is not sent to an AI service.</span>
        </label>
        <fieldset className="workspace-field format-field">
          <legend>Intended video format</legend>
          <div className="format-options">
            {formatOptions.map((option) => (
              <label className="format-option" key={option.value}>
                <input type="radio" name="format" value={option.value} defaultChecked={project?.format === option.value || (!project && option.value === 'landscape')} />
                <span className={`format-option-mark format-${option.value}`} aria-hidden="true" />
                <span className="format-option-copy"><strong>{option.title}</strong><span>{option.ratio}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        {project && <p className="project-created-date">Created {new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(project.createdAt))}</p>}
        {error && <p className="workspace-message workspace-message-error" role="alert">{error}</p>}
        <div className="project-form-actions">
          <Link className="workspace-button workspace-button-quiet" to="/app">Cancel</Link>
          <button className="workspace-button workspace-button-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : project ? 'Save changes' : 'Save project'}
          </button>
        </div>
      </form>
      <p className="workspace-trust-note">Cloud projects are private to your account. Existing browser-local drafts remain untouched and are not migrated.</p>
    </div>
  )
}

export default ProjectEditorPage
