import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../data/projects'
import { getProjectRepository } from '../data/projects'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong while loading your projects.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>()
  const [actionError, setActionError] = useState<string>()
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [deletingId, setDeletingId] = useState<string>()

  useEffect(() => {
    let isCurrent = true
    void Promise.resolve()
      .then(() => getProjectRepository().list())
      .then((savedProjects) => {
        if (isCurrent) {
          setProjects(savedProjects)
          setLoadError(undefined)
        }
      })
      .catch((cause: unknown) => {
        if (isCurrent) setLoadError(getErrorMessage(cause))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [refreshIndex])

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete “${project.title}”? This removes the saved draft from this browser.`)) return
    setDeletingId(project.id)
    setActionError(undefined)
    try {
      await getProjectRepository().delete(project.id)
      setProjects((current) => current.filter(({ id }) => id !== project.id))
    } catch (cause) {
      setActionError(getErrorMessage(cause))
    } finally {
      setDeletingId(undefined)
    }
  }

  const error = loadError ?? actionError

  return (
    <div className="dashboard-page">
      <div className="workspace-page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Projects</h1>
          <p className="workspace-page-description">A considered place to shape your next video.</p>
        </div>
        <Link className="workspace-button workspace-button-primary" to="/app/projects/new">
          <span aria-hidden="true">＋</span> New project
        </Link>
      </div>

      <section className="projects-section" aria-labelledby="projects-heading">
        <div className="projects-section-heading">
          <div>
            <h2 id="projects-heading">Recent projects</h2>
            {!isLoading && !loadError && <span>{projects.length} {projects.length === 1 ? 'draft' : 'drafts'}</span>}
          </div>
          <p>Saved locally in this browser</p>
        </div>

        {error && (
          <div className="workspace-message workspace-message-error" role="alert">
            <p>{error}</p>
            {loadError && (
              <button
                className="workspace-text-button"
                onClick={() => {
                  setLoadError(undefined)
                  setIsLoading(true)
                  setRefreshIndex((current) => current + 1)
                }}
              >
                Try again
              </button>
            )}
          </div>
        )}
        {isLoading && <p className="workspace-loading" role="status">Loading your projects…</p>}
        {!isLoading && !error && projects.length === 0 && (
          <div className="workspace-empty-state">
            <span className="empty-state-mark" aria-hidden="true">＋</span>
            <h3>Your first idea starts here.</h3>
            <p>Create a project brief to keep the title, direction, and intended format together.</p>
            <Link className="workspace-button workspace-button-secondary" to="/app/projects/new">Create a project</Link>
          </div>
        )}
        {!isLoading && !loadError && projects.length > 0 && (
          <ul className="project-list">
            {projects.map((project) => (
              <li className="project-card" key={project.id}>
                <Link className="project-card-main" to={`/app/projects/${encodeURIComponent(project.id)}`}>
                  <span className={`project-format-mark format-${project.format}`} aria-hidden="true" />
                  <span className="project-card-copy">
                    <span className="project-card-title">{project.title}</span>
                    <span className="project-card-brief">{project.brief}</span>
                    <span className="project-card-meta">
                      {project.format} <span aria-hidden="true">·</span> Created {formatDate(project.createdAt)}
                    </span>
                  </span>
                  <span className="project-card-open" aria-hidden="true">↗</span>
                </Link>
                <button
                  className="project-delete-button"
                  type="button"
                  aria-label={`Delete ${project.title}`}
                  disabled={deletingId === project.id}
                  onClick={() => void deleteProject(project)}
                >
                  {deletingId === project.id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="workspace-trust-note">Your project briefs stay in this browser. Vidio AI does not upload or sync them.</p>
    </div>
  )
}

export default DashboardPage
