// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'
import {
  ForgotPasswordPage,
  AuthCallbackPage,
  PasswordRecoveryPage,
  RequireSession,
  SignInPage,
  SignUpPage,
} from './AuthPages'

const mocks = vi.hoisted(() => ({
  listener: undefined as ((event: string, session: unknown) => void) | undefined,
  onAuthStateChange: vi.fn(),
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  getSupabaseClient: () => ({ auth: mocks }),
}))

const session = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 1_800_000_000,
  user: { id: 'test-user', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' },
}

function SignOutButton() {
  const auth = useAuth()
  return <button onClick={() => void auth.signOut()}>Sign out</button>
}

function changeField(name: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`)
  if (!input) throw new Error(`Expected an input named "${name}".`)
  fireEvent.change(input, { target: { value } })
}

function renderRoutes(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/auth/login" element={<SignInPage />} />
          <Route path="/auth/register" element={<SignUpPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/recovery" element={<PasswordRecoveryPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<RequireSession />}>
            <Route path="/app" element={<><p>Protected workspace</p><SignOutButton /><Outlet /></>} />
            <Route path="/app/projects/new" element={<p>Protected project editor</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Supabase authentication flows', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.listener = undefined
    mocks.onAuthStateChange.mockImplementation((callback) => {
      mocks.listener = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mocks.signInWithPassword.mockResolvedValue({ data: { session }, error: null })
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null })
    mocks.signOut.mockResolvedValue({ error: null })
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null })
    mocks.updateUser.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('holds the protected workspace until session restoration completes', async () => {
    let resolveSession: ((value: unknown) => void) | undefined
    mocks.getSession.mockReturnValue(new Promise((resolve) => { resolveSession = resolve }))
    renderRoutes('/app')

    expect(screen.getByRole('status')).toHaveTextContent('Checking your secure session')
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument()

    await act(async () => resolveSession?.({ data: { session }, error: null }))
    expect(await screen.findByText('Protected workspace')).toBeInTheDocument()
  })

  it('redirects signed-out visitors to login and returns them to their intended route', async () => {
    renderRoutes('/app/projects/new')
    expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: '  reader@example.test  ' } })
    changeField('password', 'a-strong-password')
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Protected project editor')).toBeInTheDocument()
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'reader@example.test',
      password: 'a-strong-password',
    })
  })

  it('keeps provider authentication errors generic', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login for reader@example.test' },
    })
    renderRoutes('/auth/login')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a-strong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Could not sign in with those details')
    expect(alert).not.toHaveTextContent('reader@example.test')
  })

  it('gives the same email-confirmation guidance when registration needs verification', async () => {
    renderRoutes('/auth/register')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.test' } })
    changeField('password', 'a-strong-password')
    changeField('confirmPassword', 'a-strong-password')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Check your inbox for a confirmation link')
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'reader@example.test',
      password: 'a-strong-password',
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    }))
  })

  it('requests recovery without revealing whether an account exists', async () => {
    renderRoutes('/auth/forgot-password')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'reader@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send recovery link' }))

    expect(await screen.findByRole('status')).toHaveTextContent('If an account can be recovered')
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      'reader@example.test',
      { redirectTo: `${window.location.origin}/auth/recovery` },
    )
  })

  it('requires an active recovery session before accepting a new password', async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null })
    renderRoutes('/auth/recovery')
    expect(await screen.findByRole('heading', { name: 'This recovery link is no longer active.' })).toBeInTheDocument()

    await act(async () => mocks.listener?.('PASSWORD_RECOVERY', session))
    expect(await screen.findByRole('heading', { name: 'Choose a new password.' })).toBeInTheDocument()
    changeField('password', 'a-new-password')
    changeField('confirmPassword', 'a-new-password')
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'a-new-password' }))
    expect(await screen.findByRole('heading', { name: 'Your password is updated.' })).toBeInTheDocument()
  })

  it('signs out and removes access to protected routes', async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null })
    renderRoutes('/app')
    expect(await screen.findByText('Protected workspace')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
    expect(mocks.signOut).toHaveBeenCalledOnce()
  })

  it('restores a confirmed email session from the auth callback', async () => {
    mocks.getSession.mockResolvedValue({ data: { session }, error: null })
    renderRoutes('/auth/callback?code=one-time-code')

    expect(await screen.findByText('Protected workspace')).toBeInTheDocument()
  })

  it('restores password recovery state after a same-tab refresh', async () => {
    sessionStorage.setItem('vidio-ai.password-recovery', 'pending')
    mocks.getSession.mockResolvedValue({ data: { session }, error: null })
    renderRoutes('/auth/recovery')

    expect(await screen.findByRole('heading', { name: 'Choose a new password.' })).toBeInTheDocument()
  })
})
