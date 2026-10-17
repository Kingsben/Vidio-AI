import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import {
  AuthCallbackPage,
  ForgotPasswordPage,
  PasswordRecoveryPage,
  RedirectAuthenticatedUser,
  RequireSession,
  SignInPage,
  SignUpPage,
} from './auth/AuthPages'
import { AuthProvider } from './auth/AuthProvider'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import ProjectEditorPage from './pages/ProjectEditorPage'
import WorkspaceLayout from './pages/WorkspaceLayout'
import './Workspace.css'
import './auth/Auth.css'

function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>This page isn’t here.</h1>
      <Link className="workspace-button workspace-button-primary" to="/">Return to Vidio AI</Link>
    </main>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<RedirectAuthenticatedUser />}>
        <Route path="/auth/login" element={<SignInPage />} />
        <Route path="/auth/register" element={<SignUpPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/auth/recovery" element={<PasswordRecoveryPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<RequireSession />}>
        <Route path="/app" element={<WorkspaceLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects/new" element={<ProjectEditorPage key="new" />} />
          <Route path="projects/:projectId" element={<ProjectEditorPage key="edit" />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
