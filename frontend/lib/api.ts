import { apiBase } from './apiBase'

export async function fetcher<T>(url: string, opts: RequestInit = {}) {
  const resolvedUrl = url.startsWith('http') ? url : `${apiBase}${url}`
  const res = await fetch(resolvedUrl, { credentials: 'include', ...opts })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'API request failed')
  }
  return (await res.json()) as T
}
