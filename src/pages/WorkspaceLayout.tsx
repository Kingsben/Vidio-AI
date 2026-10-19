import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Brand, Icon } from '../components/Brand'

function WorkspaceLayout() {
  const { signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState<string>()

  async function handleSignOut() {
    setSignOutError(undefined)
    const result = await signOut()
    if (result.error) setSignOutError(result.error)
    else navigate('/', { replace: true })
  }

  return (
    <div className="workspace-shell">
      <a className="workspace-skip-link" href="#workspace-main">Skip to workspace content</a>
      <aside className="workspace-sidebar" aria-label="Workspace">
        <NavLink to="/app" className="workspace-brand" aria-label="Vidio AI workspace">
          <Brand />
        </NavLink>
        <div className="workspace-sidebar-label">WORKSPACE</div>
        <nav className="workspace-navigation" aria-label="Workspace navigation">
          <NavLink
            to="/app"
            end
            className={() => location.pathname === '/app' && location.hash !== '#inspiration' ? 'workspace-nav-link is-active' : 'workspace-nav-link'}
          >
            <Icon name="library" />
            Projects
          </NavLink>
          <NavLink
            to="/app#inspiration"
            className={() => location.pathname === '/app' && location.hash === '#inspiration' ? 'workspace-nav-link is-active' : 'workspace-nav-link'}
          >
            <Icon name="image" />
            Inspiration
          </NavLink>
          <NavLink to="/app/studio" className={({ isActive }) => isActive ? 'workspace-nav-link is-active' : 'workspace-nav-link'}>
            <Icon name="edit" />
            AI Video Studio
          </NavLink>
          <NavLink to="/app/projects/new" className={({ isActive }) => isActive ? 'workspace-nav-link is-active' : 'workspace-nav-link'}>
            <Icon name="edit" />
            New brief
          </NavLink>
        </nav>
        <div className="workspace-sidebar-bottom">
          <p>Your cloud projects are tied to this account. Existing browser drafts are kept separate.</p>
          <NavLink to="/" className="workspace-back-link"><Icon name="arrow" /> Back to Vidio AI</NavLink>
        </div>
      </aside>
      <div className="workspace-main-column">
        <header className="workspace-topbar">
          <span>VIDIO AI <span aria-hidden="true">/</span> WORKSPACE</span>
          <div className="workspace-topbar-actions">
            <span className="workspace-local-indicator"><span aria-hidden="true" /> Private cloud workspace</span>
            <button className="workspace-signout" type="button" onClick={() => void handleSignOut()}>Sign out</button>
          </div>
        </header>
        {signOutError && <p className="workspace-message workspace-message-error signout-error" role="alert">{signOutError}</p>}
        <main id="workspace-main" className="workspace-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default WorkspaceLayout
