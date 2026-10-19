import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { Project, ProjectFormat, ProjectInput } from '../data/projects'
import { getCloudProjectRepository } from '../data/cloudProjects'
import { projectFormats } from '../data/projects'
import { briefTemplates, getBriefTemplate } from '../data/briefTemplates'

const formatLabels: Record<ProjectFormat, { title: string; ratio: string }> = {
  landscape: { title: 'Landscape', ratio: '16:9 · widescreen' },
  portrait: { title: 'Portrait', ratio: '9:16 · vertical' },
  square: { title: 'Square', ratio: '1:1 · social' },
}
const formatOptions = projectFormats.map((value) => ({ value, ...formatLabels[value] }))

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong while saving your project.'
}

function ProjectBriefFields({ initialInput, initialTemplateId, isEditing, disabled, onEdit }: {
  initialInput: ProjectInput
  initialTemplateId?: string
  isEditing: boolean
  disabled: boolean
  onEdit: () => void
}) {
  const [input, setInput] = useState(initialInput)
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? '')
  const [lastAppliedInput, setLastAppliedInput] = useState(initialInput)
  const selectedTemplate = getBriefTemplate(selectedTemplateId)

  function applyTemplate() {
    if (!selectedTemplate) return
    const hasUnsavedChanges = input.title !== lastAppliedInput.title || input.brief !== lastAppliedInput.brief || input.format !== lastAppliedInput.format
    if (hasUnsavedChanges && !window.confirm('Replace your unsaved title, brief and format with this template?')) return
    const nextInput = { title: selectedTemplate.title, brief: selectedTemplate.brief, format: selectedTemplate.format }
    setInput(nextInput)
    setLastAppliedInput(nextInput)
    onEdit()
  }

  return (
    <>
      {!isEditing && (
        <div className="brief-template-picker">
          <label className="workspace-field" htmlFor="brief-template">
            <span>Optional brief template</span>
            <select id="brief-template" value={selectedTemplateId} disabled={disabled} onChange={(event) => setSelectedTemplateId(event.target.value)} aria-describedby="brief-template-hint">
              <option value="">Choose a starting point</option>
              {briefTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
            </select>
          </label>
          <button className="workspace-button workspace-button-secondary" type="button" disabled={!selectedTemplate || disabled} onClick={applyTemplate}>Use template</button>
          <p className="field-hint" id="brief-template-hint">Templates fill the title, brief and format. Edit the placeholders to make the idea your own; nothing is saved automatically.</p>
        </div>
      )}
      <label className="workspace-field" htmlFor="project-title">
        <span id="project-title-label">Project title</span>
        <input id="project-title" aria-labelledby="project-title-label" name="title" type="text" required maxLength={100} placeholder="e.g. A quiet morning in the city"
          value={input.title} disabled={disabled} autoComplete="off" aria-describedby="project-title-hint"
          onChange={(event) => { setInput((current) => ({ ...current, title: event.target.value })); onEdit() }} />
        <span className="field-hint" id="project-title-hint">A working title you can change at any time.</span>
      </label>
      <label className="workspace-field" htmlFor="project-brief">
        <span id="project-brief-label">Project brief</span>
        <textarea id="project-brief" aria-labelledby="project-brief-label" name="brief" required rows={10} maxLength={4000}
          placeholder="Describe the subject, one clear action, setting, visual style, camera movement and intended length…"
          value={input.brief} disabled={disabled} aria-describedby="project-brief-hint"
          onChange={(event) => { setInput((current) => ({ ...current, brief: event.target.value })); onEdit() }} />
        <span className="field-hint" id="project-brief-hint">{input.brief.length.toLocaleString()} / 4,000 characters. Saved to your account; your brief is not sent to an AI service.</span>
      </label>
      <details className="brief-writing-guide">
        <summary>Tips for a clear video brief</summary>
        <ul>
          <li>Say who the video is for and what they should feel or understand.</li>
          <li>Describe the subject, setting and one action before adding visual details.</li>
          <li>Specify the style, lighting, camera movement and intended duration.</li>
          <li>Note what must stay consistent and any sound or caption plans.</li>
          <li>Use original ideas and references you have permission to use.</li>
        </ul>
      </details>
      <fieldset className="workspace-field format-field" disabled={disabled}>
        <legend>Intended video format</legend>
        <div className="format-options">
          {formatOptions.map((option) => (
            <label className="format-option" key={option.value}>
              <input type="radio" name="format" value={option.value} checked={input.format === option.value}
                onChange={() => { setInput((current) => ({ ...current, format: option.value })); onEdit() }} />
              <span className={`format-option-mark format-${option.value}`} aria-hidden="true" />
              <span className="format-option-copy"><strong>{option.title}</strong><span>{option.ratio}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  )
}

function ProjectEditorPage() {
  const { session } = useAuth()
  const userId = session?.user.id
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(projectId)
  const initialTemplate = !isEditing ? getBriefTemplate(searchParams.get('template')) : undefined
  const [loadResult, setLoadResult] = useState<{ id: string; userId: string; project?: Project; error?: string }>()
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | undefined>(() => location.state?.briefSaved ? 'Project brief saved to your account.' : undefined)
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
  }, [projectId, userId, loadAttempt])

  const hasCurrentProjectResult = Boolean(projectId && userId && loadResult?.id === projectId && loadResult.userId === userId)
  const isLoading = Boolean(projectId && !hasCurrentProjectResult)
  const project = hasCurrentProjectResult ? loadResult?.project : undefined
  const loadError = hasCurrentProjectResult ? loadResult?.error : undefined

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving || isDeleting) return
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
    setSaveMessage(undefined)
    setError(undefined)
    try {
      if (projectId) {
        const saved = await (await getCloudProjectRepository(userId)).update(projectId, input)
        setLoadResult({ id: saved.id, userId, project: saved })
        setSaveMessage('Changes saved to your account.')
      } else {
        const saved = await (await getCloudProjectRepository(userId)).create(input)
        navigate(`/app/projects/${encodeURIComponent(saved.id)}`, { state: { briefSaved: true } })
      }
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteProject() {
    if (isSaving || isDeleting || !project || !userId || !window.confirm(`Delete “${project.title}” from your cloud projects?`)) return
    setIsDeleting(true)
    setError(undefined)
    setSaveMessage(undefined)
    try {
      await (await getCloudProjectRepository(userId)).delete(project.id)
      navigate('/app')
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return <p className="workspace-loading" role="status">Loading project…</p>
  if (loadError && isEditing && !project) {
    return (
      <section className="workspace-empty-state workspace-editor-state" role="alert">
        <p className="eyebrow">PROJECT UNAVAILABLE</p>
        <h1>We couldn’t open this draft.</h1>
        <p>{loadError}</p>
        <button className="workspace-button workspace-button-secondary" type="button" onClick={() => { setLoadResult(undefined); setLoadAttempt((current) => current + 1) }}>Try again</button>
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
          <button className="workspace-button workspace-button-danger" type="button" disabled={isSaving || isDeleting} onClick={() => void deleteProject()}>
            {isDeleting ? 'Deleting…' : 'Delete project'}
          </button>
        )}
      </div>

      <form className="project-form" onSubmit={(event) => void saveProject(event)} aria-busy={isSaving || isDeleting}>
        <ProjectBriefFields key={`${userId}:${project?.id ?? 'new'}`}
          initialInput={project ?? initialTemplate ?? { title: '', brief: '', format: 'landscape' }}
          initialTemplateId={initialTemplate?.id} isEditing={isEditing} disabled={isSaving || isDeleting}
          onEdit={() => { setSaveMessage(undefined); setError(undefined) }} />

        {project && <p className="project-created-date">Created {new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(project.createdAt))}</p>}
        {error && <p className="workspace-message workspace-message-error" role="alert">{error}</p>}
        {(isSaving || isDeleting || saveMessage) && <p className="project-save-status" role="status">{isSaving ? 'Saving your brief to your account…' : isDeleting ? 'Deleting project…' : saveMessage}</p>}
        <div className="project-form-actions">
          <Link className="workspace-button workspace-button-quiet" to="/app">Cancel</Link>
          <button className="workspace-button workspace-button-primary" type="submit" disabled={isSaving || isDeleting}>
            {isSaving ? 'Saving…' : project ? 'Save changes' : 'Save project'}
          </button>
        </div>
      </form>
      <p className="workspace-trust-note">Cloud projects are private to your account. Existing browser-local drafts remain untouched and are not migrated.</p>
    </div>
  )
}

export default ProjectEditorPage
