import { apiBase } from './apiBase'

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const headers = new Headers(init?.headers as HeadersInit || {})
  const url = typeof input === 'string' ? input : input.url

  // If a caller passes a bare path (e.g. "/progress"), prefix it with the API base.
  const resolvedUrl = typeof input === 'string' && !input.startsWith('http')
    ? `${apiBase}${input}`
    : input

  return fetch(resolvedUrl, { ...init, credentials: 'include', headers })
}
