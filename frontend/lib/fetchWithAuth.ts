export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const headers = new Headers(init?.headers as HeadersInit || {})
  return fetch(input, { ...init, credentials: 'include', headers })
}
