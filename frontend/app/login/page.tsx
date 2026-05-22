'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      localStorage.setItem('token', data.token)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-3xl px-6 py-16 md:px-10">
        <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-10 shadow-soft">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Welcome back</p>
          <h1 className="mt-4 text-4xl font-display font-semibold">Log in to your learning hub.</h1>
          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Email address</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary"
                placeholder="tatenda@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary"
                placeholder="Enter your password"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26] disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Continue'}
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm text-text-secondary">
            <a href="/forgot-password" className="font-semibold text-accent-primary hover:underline">Forgot password?</a>
            <a href="/sign-up" className="font-semibold text-accent-primary hover:underline">Create account</a>
          </div>
          <div className="mt-10 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6 text-center">
            <p className="text-sm text-text-secondary">Or continue with Google</p>
            <button type="button" className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[rgba(28,25,23,0.08)] bg-white px-6 py-3 text-sm font-semibold text-text-primary transition hover:bg-[#fbf2e7]">
              Continue with Google
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
