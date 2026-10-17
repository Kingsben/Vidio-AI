import { createClient } from '@supabase/supabase-js'

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          brief: string
          format: string
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          brief?: string
          format?: string
        }
        Update: {
          title?: string
          brief?: string
          format?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export function validateSupabaseConfig(config: SupabaseConfig): SupabaseConfig {
  const urlValue = config.url.trim()
  const keyValue = config.publishableKey.trim()
  if (!urlValue || !keyValue) {
    throw new Error('Supabase configuration is missing. Set the project URL and publishable key.')
  }

  let url: URL
  try {
    url = new URL(urlValue)
  } catch {
    throw new Error('Supabase project URL is invalid.')
  }

  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost)) ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.pathname !== '/' ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new Error('Supabase project URL must be an HTTPS origin (HTTP is allowed only for localhost).')
  }

  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(keyValue)) {
    throw new Error('Supabase key must be a public publishable key.')
  }

  return { url: url.origin, publishableKey: keyValue }
}

let client: ReturnType<typeof createClient<Database>> | undefined

export function getSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (!client) {
    const config = validateSupabaseConfig({
      url: import.meta.env.VITE_SUPABASE_URL ?? '',
      publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    })
    client = createClient<Database>(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
      },
    })
  }
  return client
}
