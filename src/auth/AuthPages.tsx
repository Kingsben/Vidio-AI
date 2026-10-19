import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Photo } from '../components/Photo'
import { getSafeAppRedirect, type AuthLocationState } from './auth'
import { useAuth } from './AuthContext'

function redirectFromState(state: unknown) {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/app'
  const from = (state as AuthLocationState).from
  if (!from || typeof from.pathname !== 'string') return '/app'
  return getSafeAppRedirect(`${from.pathname}${from.search}${from.hash}`)
}

export function AuthLoadingPage() {
  return (
    <main className="auth-loading" role="status" aria-live="polite">
      <span className="auth-loading-mark" aria-hidden="true" />
      <p>Checking your secure session…</p>
    </main>
  )
}

function AuthUnavailable() {
  return (
    <div className="auth-notice auth-notice-error" role="alert">
      <p>Authentication is temporarily unavailable. Please try again in a moment.</p>
      <button className="auth-inline-button" type="button" onClick={() => window.location.reload()}>Try again</button>
    </div>
  )
}

export function RequireSession() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading) return <AuthLoadingPage />
  if (auth.initializationError) return <AuthUnavailable />
  if (auth.recoveryPending && auth.session) return <Navigate to="/auth/recovery" replace />
  if (!auth.session) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

export function RedirectAuthenticatedUser() {
  const { loading, initializationError, session, recoveryPending } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoadingPage />
  if (initializationError) return <Outlet />
  if (session && recoveryPending) return <Navigate to="/auth/recovery" replace />
  if (session) return <Navigate to={redirectFromState(location.state)} replace />
  return <Outlet />
}

function CreativeMediaPanel() {
  return (
    <aside className="auth-creative-side" aria-label="Creative visual directions">
      <div className="auth-creative-heading"><span>THE CREATIVE OUTLOOK</span><span>01 / 03</span></div>
      <div className="auth-creative-main">
        <Photo name="coast" sizes="55vw" priority />
        <div className="auth-creative-caption"><span>CINEMATIC / NATURE</span><h2>Every great film<br />starts with a point of view.</h2></div>
      </div>
      <div className="auth-creative-strip">
        <figure><Photo name="city" sizes="25vw" /><figcaption>Culture &amp; social</figcaption></figure>
        <figure><Photo name="architecture" sizes="25vw" /><figcaption>Design &amp; brand stories</figcaption></figure>
      </div>
      <p className="auth-media-credit">Photography for creative inspiration. <a href={`${import.meta.env.BASE_URL}photography-credits.md`}>Photographers &amp; licences ↗</a></p>
    </aside>
  )
}

function AuthLayout({ children, heading, description }: {
  children: ReactNode
  heading: string
  description: string
}) {
  const { initializationError } = useAuth()
  return (
    <main className="auth-page">
      <div className="auth-form-side">
        <Link to="/" className="auth-brand" aria-label="Vidio AI home"><Brand /></Link>
        <div className="auth-form-wrap">
          {initializationError && <AuthUnavailable />}
          <p className="eyebrow">VIDIO AI · CREATIVE WORKSPACE</p>
          <h1>{heading}</h1>
          <p className="auth-description">{description}</p>
          {children}
          <p className="auth-footer-note">Your account protects access to your private workspace. Video generation, editing, and publishing are in development.</p>
        </div>
        <Link className="auth-back-link" to="/">Back to Vidio AI</Link>
      </div>
      <CreativeMediaPanel />
    </main>
  )
}

function AuthFeedback({ message, error = false }: { message?: string; error?: boolean }) {
  if (!message) return null
  return <p className={error ? 'auth-notice auth-notice-error' : 'auth-notice'} role={error ? 'alert' : 'status'}>{message}</p>
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? '').trim().toLowerCase()
}

export function SignInPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const data = new FormData(event.currentTarget)
    const result = await auth.signIn(normalizeEmail(data.get('email')), String(data.get('password') ?? ''))
    setBusy(false)
    if (result.error) setError(result.error)
    else navigate(redirectFromState(location.state), { replace: true })
  }

  return (
    <AuthLayout heading="Welcome back." description="Sign in to continue shaping your video ideas.">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label className="auth-field">
          <span>Email address</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email" autoFocus />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <Link className="auth-subtle-link" to="/auth/forgot-password">Forgot password?</Link>
        <AuthFeedback message={error} error />
        <button className="auth-submit" type="submit" disabled={busy || Boolean(auth.initializationError)}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch">New to Vidio AI? <Link to="/auth/register" state={location.state}>Create an account</Link></p>
    </AuthLayout>
  )
}

export function SignUpPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirmationRequired, setConfirmationRequired] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    setConfirmationRequired(false)
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    if (password.length < 12) {
      setError('Use at least 12 characters for your password.')
      setBusy(false)
      return
    }
    if (password !== String(data.get('confirmPassword') ?? '')) {
      setError('Those passwords do not match.')
      setBusy(false)
      return
    }
    const result = await auth.signUp(normalizeEmail(data.get('email')), password)
    setBusy(false)
    if (result.error) setError(result.error)
    else if (result.emailConfirmationRequired) setConfirmationRequired(true)
    else navigate(redirectFromState(location.state), { replace: true })
  }

  return (
    <AuthLayout heading="Your next idea starts here." description="Create an account for your Vidio AI workspace.">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label className="auth-field">
          <span>Email address</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email" autoFocus />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input name="password" type="password" required aria-describedby="password-guidance" minLength={12} autoComplete="new-password" />
          <small id="password-guidance">Use at least 12 characters.</small>
        </label>
        <label className="auth-field">
          <span>Confirm password</span>
          <input name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" />
        </label>
        <AuthFeedback message={error} error />
        {confirmationRequired && (
          <AuthFeedback message="Check your inbox for a confirmation link. Once your email is confirmed, sign in to open your workspace." />
        )}
        <button className="auth-submit" type="submit" disabled={busy || Boolean(auth.initializationError)}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/auth/login" state={location.state}>Sign in</Link></p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const auth = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const data = new FormData(event.currentTarget)
    const result = await auth.sendPasswordReset(normalizeEmail(data.get('email')))
    setBusy(false)
    if (result.error) setError(result.error)
    else setSent(true)
  }

  return (
    <AuthLayout heading="Let’s get you back in." description="Request a secure password recovery link by email.">
      {sent ? (
        <div className="auth-notice" role="status">
          <p>If an account can be recovered, a link will arrive shortly. Check your inbox and spam folder. The link opens a secure recovery session in this browser.</p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <label className="auth-field">
            <span>Email address</span>
            <input name="email" type="email" required maxLength={254} autoComplete="email" autoFocus />
          </label>
          <AuthFeedback message={error} error />
          <button className="auth-submit" type="submit" disabled={busy || Boolean(auth.initializationError)}>
            {busy ? 'Sending…' : 'Send recovery link'}
          </button>
        </form>
      )}
      <p className="auth-switch"><Link to="/auth/login">Back to sign in</Link></p>
    </AuthLayout>
  )
}

export function PasswordRecoveryPage() {
  const { session, loading, initializationError, recoveryPending, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [updated, setUpdated] = useState(false)

  if (loading) return <AuthLoadingPage />
  if (initializationError) {
    return (
      <AuthLayout heading="Recovery is temporarily unavailable." description="We could not verify this recovery session. Request a fresh recovery link after service is available.">
        <AuthUnavailable />
        <Link className="auth-subtle-link" to="/auth/forgot-password">Request a new recovery link</Link>
      </AuthLayout>
    )
  }
  if (updated) {
    return (
      <AuthLayout heading="Your password is updated." description="Your account is ready. Continue planning your next video.">
        <AuthFeedback message="Your new password is saved securely. Continue to your workspace." />
        <button className="auth-submit" type="button" onClick={() => navigate('/app', { replace: true })}>Continue to workspace</button>
      </AuthLayout>
    )
  }
  if (!session || !recoveryPending) {
    return (
      <AuthLayout heading="This recovery link is no longer active." description="Recovery links are secure and time-limited. Request a new one to continue.">
        <Link className="auth-submit auth-submit-link" to="/auth/forgot-password">Request a new link</Link>
        <p className="auth-switch"><Link to="/auth/login">Back to sign in</Link></p>
      </AuthLayout>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    if (password.length < 12) {
      setError('Use at least 12 characters for your password.')
      setBusy(false)
      return
    }
    if (password !== String(data.get('confirmPassword') ?? '')) {
      setError('Those passwords do not match.')
      setBusy(false)
      return
    }
    const result = await updatePassword(password)
    setBusy(false)
    if (result.error) setError(result.error)
    else setUpdated(true)
  }

  return (
    <AuthLayout heading="Choose a new password." description="Create a new password for your account.">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label className="auth-field">
          <span>New password</span>
          <input name="password" type="password" required aria-describedby="password-guidance" minLength={12} autoComplete="new-password" autoFocus />
          <small id="password-guidance">Use at least 12 characters.</small>
        </label>
        <label className="auth-field">
          <span>Confirm new password</span>
          <input name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" />
        </label>
        <AuthFeedback message={error} error />
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}

export function AuthCallbackPage() {
  const { loading, initializationError, session, recoveryPending } = useAuth()
  if (loading) return <AuthLoadingPage />
  if (initializationError) {
    return (
      <AuthLayout heading="Confirmation is temporarily unavailable." description="Your confirmation link may still be valid. Try again when authentication is available.">
        <AuthUnavailable />
      </AuthLayout>
    )
  }
  if (recoveryPending && session) return <Navigate to="/auth/recovery" replace />
  if (session) return <Navigate to="/app" replace />
  return (
    <AuthLayout heading="Check your confirmation link." description="The link may have expired or already been used.">
      <AuthFeedback message="If email confirmation is enabled, open the latest link from your inbox in this browser. You can also sign in after confirming." />
      <Link className="auth-submit auth-submit-link" to="/auth/login">Continue to sign in</Link>
      <p className="auth-switch"><Link to="/auth/register">Create an account</Link></p>
    </AuthLayout>
  )
}
