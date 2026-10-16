import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Project, ProjectFormat, ProjectInput } from '../data/projects'
import { getProjectRepository } from '../data/projects'
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
  const { projectId } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(projectId)
  const [loadResult, setLoadResult] = useState<{ id: string; project?: Project; error?: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!projectId) return
    let isCurrent = true
    void Promise.resolve()
      .then(() => getProjectRepository().get(projectId))
      .then((savedProject) => {
        if (isCurrent) setLoadResult({ id: projectId, project: savedProject })
      })
      .catch((cause: unknown) => {
        if (isCurrent) setLoadResult({ id: projectId, error: getErrorMessage(cause) })
      })
    return () => {
      isCurrent = false
    }
  }, [projectId])

  const isLoading = Boolean(projectId && loadResult?.id !== projectId)
  const project = projectId && loadResult?.id === projectId ? loadResult.project : undefined
  const loadError = projectId && loadResult?.id === projectId ? loadResult.error : undefined

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
    setIsSaving(true)
    setError(undefined)
    try {
      const saved = projectId
        ? await getProjectRepository().update(projectId, input)
        : await getProjectRepository().create(input)
      navigate(`/app/projects/${encodeURIComponent(saved.id)}`)
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteProject() {
    if (!project || !window.confirm(`Delete “${project.title}”? This removes the saved draft from this browser.`)) return
    setError(undefined)
    try {
      await getProjectRepository().delete(project.id)
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
        <p>It may have been removed, or it may belong to another browser.</p>
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
            Keep the essentials together. This creates a local draft, not a generated video.
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
          <span className="field-hint">Your notes stay private in this browser and are not sent to an AI service.</span>
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
      <p className="workspace-trust-note">Drafts are stored in this browser only. They are not synced or backed up to an account.</p>
    </div>
  )
}

export default ProjectEditorPage
