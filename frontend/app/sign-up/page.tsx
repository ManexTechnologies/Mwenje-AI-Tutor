'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSubjectsForGrade } from '@/lib/learning'
import { signUpUser } from '@/lib/auth'
import { useProfile } from '@/components/profile-provider'

const grades = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6']
const curricula = ['ZIMSEC', 'Cambridge']

function getSignupErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Sign up failed'

  return message
}

export default function SignUpPage() {
  const router = useRouter()
  const { refreshAuth } = useProfile()
  const [form, setForm] = useState({ name: '', email: '', password: '', grade: '', curriculum: 'ZIMSEC' })
  const [step, setStep] = useState(1)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const availableSubjects = getSubjectsForGrade(form.grade)

  function handleGradeChange(grade: string) {
    const nextSubjects = getSubjectsForGrade(grade)
    setForm({ ...form, grade })
    setSelectedSubjects((current) => {
      return current.filter((subject) => nextSubjects.includes(subject))
    })
  }

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 1) {
      setStep(2)
      return
    }

    if (!selectedSubjects.length) {
      setError('Choose at least one subject you are studying.')
      return
    }

    setLoading(true)

    try {
      await signUpUser({
        name: form.name,
        email: form.email,
        password: form.password,
        grade: form.grade,
        curriculum: form.curriculum,
        subjects: selectedSubjects
      })
      await refreshAuth()
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(getSignupErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
<div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Mwenje logo" className="h-12 w-12 rounded-full object-cover shadow-sm" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-text-primary">MWENJE</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-primary">Learn Smart Shine Bright</span>
            </div>
          </div>
          <p className="mt-8 text-sm uppercase tracking-[0.28em] text-accent-secondary">Create your Mwenje account</p>
          <h1 className="mt-4 text-3xl font-display font-semibold sm:text-4xl">
            {step === 1 ? 'Sign up and start learning.' : 'Choose your subjects.'}
          </h1>
          <div className="mt-6 flex gap-2">
            {[1, 2].map((item) => (
              <span key={item} className={`h-2 flex-1 rounded-full ${item <= step ? 'bg-accent-primary' : 'bg-bg-secondary'}`} />
            ))}
          </div>
          {error && (
            <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {step === 1 ? (
              <>
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
                      onChange={(e) => handleGradeChange(e.target.value)}
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
              </>
            ) : (
              <div>
                <p className="text-sm leading-6 text-text-secondary">
                  Pick the subjects you are studying. Mwenje will use this to personalise your tutor, quizzes, planner, and progress tracking.
                </p>
                <p className="mt-3 text-sm font-semibold text-accent-primary">{selectedSubjects.length} selected</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {availableSubjects.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject)
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`rounded-3xl border px-5 py-3 text-left text-sm font-semibold transition ${
                          isSelected
                            ? 'border-accent-primary bg-[#FFF0E6] text-accent-primary'
                            : 'border-[rgba(28,25,23,0.08)] bg-bg-secondary text-text-secondary hover:bg-[#fbf2e7]'
                        }`}
                      >
                        {subject}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-bg-secondary px-6 py-4 text-sm font-semibold text-text-primary transition hover:bg-[#fbf2e7] disabled:opacity-50"
                >
                  Back
                </button>
              ) : <span />}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26] disabled:opacity-50 sm:w-auto"
              >
                {loading ? 'Creating account...' : step === 1 ? 'Continue' : 'Start learning'}
              </button>
            </div>
          </form>
          <p className="mt-8 text-center text-text-secondary">
            Already have an account? <a href="/login" className="font-semibold text-accent-primary hover:underline">Log in</a>
          </p>
        </div>
      </section>
    </main>
  )
}
