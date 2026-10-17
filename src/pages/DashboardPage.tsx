import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { Project } from '../data/projects'
import { getCloudProjectRepository } from '../data/cloudProjects'
import CreativeInspiration from '../components/CreativeInspiration'
import { Icon } from '../components/Brand'
import './DashboardPage.css'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong while loading your projects.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function DashboardPage() {
  const { session } = useAuth()
  const userId = session?.user.id
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedUserId, setLoadedUserId] = useState<string>()
  const [loadError, setLoadError] = useState<string>()
  const [actionError, setActionError] = useState<{ userId: string; message: string }>()
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [deletingId, setDeletingId] = useState<string>()

  useEffect(() => {
    let isCurrent = true
    if (!userId) {
      return () => {
        isCurrent = false
      }
    }
    void Promise.resolve()
      .then(async () => (await getCloudProjectRepository(userId)).list())
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
        if (isCurrent) {
          setLoadedUserId(userId)
          setIsLoading(false)
        }
      })
    return () => {
      isCurrent = false
    }
  }, [refreshIndex, userId])

  useEffect(() => {
    if (location.hash !== '#inspiration') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('inspiration')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [location.hash])

  async function deleteProject(project: Project) {
    if (!userId || !window.confirm(`Delete “${project.title}” from your cloud projects?`)) return
    setDeletingId(project.id)
    setActionError(undefined)
    try {
      await (await getCloudProjectRepository(userId)).delete(project.id)
      setProjects((current) => current.filter(({ id }) => id !== project.id))
    } catch (cause) {
      setActionError({ userId, message: getErrorMessage(cause) })
    } finally {
      setDeletingId(undefined)
    }
  }

  const projectsReady = Boolean(userId && loadedUserId === userId && !isLoading)
  const error = projectsReady
    ? loadError ?? (actionError && actionError.userId === userId ? actionError.message : undefined)
    : undefined

  return (
    <div className="dashboard-page">
      <section className="dashboard-intro" aria-labelledby="dashboard-heading">
        <div className="dashboard-intro-copy">
          <p className="eyebrow">YOUR CREATIVE WORKSPACE</p>
          <h1 id="dashboard-heading">What are we making today?</h1>
          <p>Explore visual references, shape a brief, and keep your next video idea in one place.</p>
        </div>
        <Link className="workspace-button workspace-button-primary dashboard-create-brief" to="/app/projects/new">
          <span aria-hidden="true">＋</span> Create project brief
        </Link>
      </section>

      <section className="creation-options" aria-label="Creation options">
        <div className="creation-option-live">
          <span className="creation-option-icon" aria-hidden="true"><Icon name="edit" /></span>
          <span className="creation-option-copy">
            <strong>Project brief</strong>
            <span>Available now · saved to your account</span>
          </span>
          <Link to="/app/projects/new" aria-label="Create a project brief"><Icon name="arrow" /></Link>
        </div>
        <ul className="creation-option-upcoming">
          {[
            ['AI video', 'In development'],
            ['AI animation', 'In development'],
            ['Video editing', 'In development'],
            ['Social publishing', 'Planned'],
          ].map(([name, status]) => (
            <li key={name}>
              <span>{name}</span>
              <small>{status}</small>
            </li>
          ))}
        </ul>
      </section>

      <CreativeInspiration />

      <section className="projects-section" id="projects" aria-labelledby="projects-heading">
        <div className="projects-section-heading">
          <div>
            <h2 id="projects-heading">Recent project briefs</h2>
            {projectsReady && !loadError && <span>{projects.length} {projects.length === 1 ? 'draft' : 'drafts'}</span>}
          </div>
          <Link className="workspace-text-button projects-new-link" to="/app/projects/new">New brief <span aria-hidden="true">↗</span></Link>
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
        {!projectsReady && <p className="workspace-loading" role="status">Loading your cloud projects…</p>}
        {projectsReady && !error && projects.length === 0 && (
          <div className="workspace-empty-state dashboard-empty-state">
            <span className="empty-state-mark" aria-hidden="true">＋</span>
            <h3>No project briefs yet.</h3>
            <p>Start with a title, creative direction, and intended format. This saves a project brief, not a generated video.</p>
            <Link className="workspace-button workspace-button-secondary" to="/app/projects/new">Create a project brief</Link>
          </div>
        )}
        {projectsReady && !error && projects.length > 0 && (
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

      <p className="workspace-trust-note">Cloud projects are private to your account. Existing browser-local drafts remain untouched and are not migrated.</p>
    </div>
  )
}

export default DashboardPage
