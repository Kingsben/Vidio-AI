import type { Location } from 'react-router-dom'

export interface AuthLocationState {
  from?: Pick<Location, 'pathname' | 'search' | 'hash'>
}

export function getSafeAppRedirect(candidate: unknown): string {
  if (typeof candidate !== 'string' || !candidate.startsWith('/app') || candidate.startsWith('//') || candidate.includes('\\')) {
    return '/app'
  }

  try {
    const target = new URL(candidate, 'https://vidio.invalid')
    if (
      target.origin !== 'https://vidio.invalid' ||
      (target.pathname !== '/app' && !target.pathname.startsWith('/app/'))
    ) {
      return '/app'
    }
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/app'
  }
}
