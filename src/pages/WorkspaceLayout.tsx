import { NavLink, Outlet } from 'react-router-dom'
import { Brand, Icon } from '../components/Brand'

function WorkspaceLayout() {
  return (
    <div className="workspace-shell">
      <a className="workspace-skip-link" href="#workspace-main">Skip to workspace content</a>
      <aside className="workspace-sidebar" aria-label="Workspace">
        <NavLink to="/app" className="workspace-brand" aria-label="Vidio AI workspace">
          <Brand />
        </NavLink>
        <div className="workspace-sidebar-label">WORKSPACE</div>
        <nav className="workspace-navigation" aria-label="Workspace navigation">
          <NavLink to="/app" end className={({ isActive }) => isActive ? 'workspace-nav-link is-active' : 'workspace-nav-link'}>
            <Icon name="library" />
            Projects
          </NavLink>
          <NavLink to="/app/projects/new" className={({ isActive }) => isActive ? 'workspace-nav-link is-active' : 'workspace-nav-link'}>
            <Icon name="edit" />
            New project
          </NavLink>
        </nav>
        <div className="workspace-sidebar-bottom">
          <p>Your drafts are saved in this browser. They are not synced across devices.</p>
          <NavLink to="/" className="workspace-back-link"><Icon name="arrow" /> Back to Vidio AI</NavLink>
        </div>
      </aside>
      <div className="workspace-main-column">
        <header className="workspace-topbar">
          <span>VIDIO AI <span aria-hidden="true">/</span> WORKSPACE</span>
          <span className="workspace-local-indicator"><span aria-hidden="true" /> Stored on this device</span>
        </header>
        <main id="workspace-main" className="workspace-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default WorkspaceLayout
