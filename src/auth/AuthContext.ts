import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthResult {
  error?: string
  emailConfirmationRequired?: boolean
}

export interface AuthContextValue {
  session: Session | null
  loading: boolean
  initializationError?: string
  recoveryPending: boolean
  signIn(email: string, password: string): Promise<AuthResult>
  signUp(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<AuthResult>
  sendPasswordReset(email: string): Promise<AuthResult>
  updatePassword(password: string): Promise<AuthResult>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
