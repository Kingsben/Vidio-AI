import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthContextValue, type AuthResult } from './AuthContext'

const recoveryMarker = 'vidio-ai.password-recovery'

function readRecoveryMarker() {
  try {
    return window.sessionStorage.getItem(recoveryMarker) === 'pending'
  } catch {
    return false
  }
}

function writeRecoveryMarker(pending: boolean) {
  try {
    if (pending) window.sessionStorage.setItem(recoveryMarker, 'pending')
    else window.sessionStorage.removeItem(recoveryMarker)
  } catch {
    return
  }
}

function authOrigin(path: string) {
  return new URL(path, window.location.origin).toString()
}

async function loadSupabaseClient() {
  const { getSupabaseClient } = await import('../lib/supabase')
  return getSupabaseClient()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializationError, setInitializationError] = useState<string>()
  const [recoveryPending, setRecoveryPending] = useState(false)

  useEffect(() => {
    let active = true
    let eventRevision = 0
    let unsubscribe: (() => void) | undefined
    void Promise.resolve().then(async () => {
      let client
      try {
        client = await loadSupabaseClient()
      } catch {
        if (active) {
          setInitializationError('Authentication is not available. Check the Supabase project configuration and try again.')
          setLoading(false)
        }
        return
      }

      if (!active) return
      setRecoveryPending(readRecoveryMarker())
      const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
        eventRevision += 1
        if (!active) return
        setInitializationError(undefined)
        setSession(nextSession)
        if (event === 'PASSWORD_RECOVERY') {
          writeRecoveryMarker(true)
          setRecoveryPending(true)
        } else if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
          writeRecoveryMarker(false)
          setRecoveryPending(false)
        }
        setLoading(false)
      })
      unsubscribe = () => subscription.unsubscribe()

      const startingRevision = eventRevision
      try {
        const { data, error } = await client.auth.getSession()
        if (!active) return
        if (eventRevision === startingRevision) {
          if (error) setInitializationError('Could not restore your session. Please try again.')
          else setSession(data.session)
        }
      } catch {
        if (active && eventRevision === startingRevision) {
          setInitializationError('Could not restore your session. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }).catch(() => {
      if (active) {
        setInitializationError('Authentication is not available right now. Please try again.')
        setLoading(false)
      }
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  async function signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await (await loadSupabaseClient()).auth.signInWithPassword({ email, password })
      if (error) return { error: 'Could not sign in with those details. Check them and try again.' }
      setSession(data.session)
      setRecoveryPending(false)
      writeRecoveryMarker(false)
      setInitializationError(undefined)
      return {}
    } catch {
      return { error: 'Sign-in is unavailable right now. Please try again.' }
    }
  }

  async function signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await (await loadSupabaseClient()).auth.signUp({
        email,
        password,
        options: { emailRedirectTo: authOrigin('/auth/callback') },
      })
      if (error) return { error: 'Could not complete registration. Please check your details and try again.' }
      if (data.session) setSession(data.session)
      setRecoveryPending(false)
      writeRecoveryMarker(false)
      return { emailConfirmationRequired: !data.session }
    } catch {
      return { error: 'Registration is unavailable right now. Please try again.' }
    }
  }

  async function signOut(): Promise<AuthResult> {
    try {
      const { error } = await (await loadSupabaseClient()).auth.signOut()
      if (error) return { error: 'Could not sign out right now. Please try again.' }
      setSession(null)
      setRecoveryPending(false)
      writeRecoveryMarker(false)
      return {}
    } catch {
      return { error: 'Could not sign out right now. Please try again.' }
    }
  }

  async function sendPasswordReset(email: string): Promise<AuthResult> {
    try {
      const { error } = await (await loadSupabaseClient()).auth.resetPasswordForEmail(email, {
        redirectTo: authOrigin('/auth/recovery'),
      })
      if (error) return { error: 'Could not send a recovery email right now. Please try again later.' }
      return {}
    } catch {
      return { error: 'Could not send a recovery email right now. Please try again later.' }
    }
  }

  async function updatePassword(password: string): Promise<AuthResult> {
    try {
      const { error } = await (await loadSupabaseClient()).auth.updateUser({ password })
      if (error) return { error: 'Could not update your password. The recovery link may have expired; request a new one and try again.' }
      setRecoveryPending(false)
      writeRecoveryMarker(false)
      return {}
    } catch {
      return { error: 'Could not update your password. The recovery link may have expired; request a new one and try again.' }
    }
  }

  const value: AuthContextValue = {
    session,
    loading,
    initializationError,
    recoveryPending,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
