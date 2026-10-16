import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ProjectEditorPage from './pages/ProjectEditorPage'
import WorkspaceLayout from './pages/WorkspaceLayout'
import './Workspace.css'

function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>This page isn’t here.</h1>
      <Link className="workspace-button workspace-button-primary" to="/">Return to Vidio AI</Link>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<WorkspaceLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects/new" element={<ProjectEditorPage key="new" />} />
          <Route path="projects/:projectId" element={<ProjectEditorPage key="edit" />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
