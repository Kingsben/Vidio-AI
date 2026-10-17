import { describe, expect, it } from 'vitest'
import { validateSupabaseConfig } from './supabase'

describe('validateSupabaseConfig', () => {
  const validConfig = {
    url: 'https://project-ref.supabase.co',
    publishableKey: 'sb_publishable_exampleKey_123',
  }

  it('accepts a public HTTPS project URL and publishable key', () => {
    expect(validateSupabaseConfig(validConfig)).toEqual(validConfig)
  })

  it('allows HTTP only for local Supabase development', () => {
    expect(validateSupabaseConfig({
      ...validConfig,
      url: 'http://localhost:54321',
    }).url).toBe('http://localhost:54321')
  })

  it('rejects missing configuration without exposing key contents', () => {
    expect(() => validateSupabaseConfig({ url: '', publishableKey: validConfig.publishableKey }))
      .toThrow('configuration is missing')
  })

  it.each([
    'not-a-url',
    'http://project-ref.supabase.co',
    'https://user:password@project-ref.supabase.co',
    'https://project-ref.supabase.co/path',
  ])('rejects an invalid project URL: %s', (url) => {
    expect(() => validateSupabaseConfig({ ...validConfig, url })).toThrow('project URL')
  })

  it.each([
    'sb_secret_exampleKey',
    'service_role_exampleKey',
    'eyJhbGciOiJIUzI1NiJ9.example.signature',
  ])('rejects a key that is not public publishable format: %s', (publishableKey) => {
    expect(() => validateSupabaseConfig({ ...validConfig, publishableKey }))
      .toThrow('public publishable key')
  })
})
