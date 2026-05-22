'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const grades = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6']
const curricula = ['ZIMSEC', 'Cambridge']

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', grade: '', curriculum: 'ZIMSEC' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:4000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign up failed')
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
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Create your Mwenje account</p>
          <h1 className="mt-4 text-4xl font-display font-semibold">Sign up and start learning.</h1>
          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Full name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary"
                placeholder="Tatenda M"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Email address</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary"
                placeholder="tatenda@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Password</span>
              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary"
                placeholder="Create a secure password"
              />
            </label>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Grade level</span>
                <select
                  required
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary"
                >
                  <option value="">Select grade</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Curriculum</span>
                <select
                  value={form.curriculum}
                  onChange={(e) => setForm({ ...form, curriculum: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary"
                >
                  {curricula.map((curriculum) => (
                    <option key={curriculum} value={curriculum}>{curriculum}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26] disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-8 text-center text-text-secondary">
            Already have an account? <a href="/login" className="font-semibold text-accent-primary hover:underline">Log in</a>
          </p>
        </div>
      </section>
    </main>
  )
}
