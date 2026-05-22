export async function fetcher<T>(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, { credentials: 'include', ...opts })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'API request failed')
  }
  return (await res.json()) as T
}
