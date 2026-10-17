import { describe, expect, it } from 'vitest'
import { getSafeAppRedirect } from './auth'

describe('getSafeAppRedirect', () => {
  it('keeps intended workspace destinations', () => {
    expect(getSafeAppRedirect('/app/projects/new')).toBe('/app/projects/new')
    expect(getSafeAppRedirect('/app?tab=recent#list')).toBe('/app?tab=recent#list')
  })

  it.each([
    undefined,
    '',
    '/',
    '/auth/login',
    '//example.com/app',
    'https://example.com/app',
    '/app\\@example.com',
    '/application',
  ])('rejects unsafe redirect destinations: %s', (path) => {
    expect(getSafeAppRedirect(path)).toBe('/app')
  })
})
