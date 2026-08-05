'use client'

import { useEffect, useState } from 'react'
import { useProfile } from '@/components/profile-provider'
import { getSubjectsForGrade } from '@/lib/learning'
import { saveUserProfile } from '@/lib/profile'

const grades = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Lower 6', 'Upper 6']
const curricula = ['ZIMSEC', 'Cambridge']

export default function ProfilePage() {
  const { user: currentUser, profile, loadingProfile, profileError, refreshProfile } = useProfile()
  const [form, setForm] = useState({
    name: '',
    email: '',
    school: '',
    grade: '',
    curriculum: 'ZIMSEC',
    learningGoals: 'Improve exam performance',
    preferredLearningStyle: 'step-by-step examples',
    weakAreas: '',
    examinationYear: ''
  })
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics', 'English Language'])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const availableSubjects = getSubjectsForGrade(form.grade)

  function handleGradeChange(grade: string) {
    const nextSubjects = getSubjectsForGrade(grade)
    setForm({ ...form, grade })
    setSelectedSubjects((current) => {
      const selectedForGrade = current.filter((subject) => nextSubjects.includes(subject))
      return selectedForGrade.length ? selectedForGrade : ['Mathematics', 'English Language'].filter((subject) => nextSubjects.includes(subject))
    })
  }

  useEffect(() => {
    setStatus('')
    setError(profileError || '')

    if (!currentUser) {
      setForm({ name: '', email: '', school: '', grade: '', curriculum: 'ZIMSEC', learningGoals: '', preferredLearningStyle: '', weakAreas: '', examinationYear: '' })
      setSelectedSubjects(['Mathematics', 'English Language'])
      return
    }

    if (!profile) return

    setForm({
      name: profile.name,
      email: profile.email,
      school: profile.school,
      grade: profile.grade,
      curriculum: profile.curriculum,
      learningGoals: profile.learningGoals.join(', '),
      preferredLearningStyle: profile.preferredLearningStyle,
      weakAreas: profile.weakAreas.join(', '),
      examinationYear: profile.examinationYear ? String(profile.examinationYear) : ''
    })
    setSelectedSubjects(profile.subjects.length ? profile.subjects : ['Mathematics', 'English Language'])
  }, [currentUser, profile, profileError])

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setStatus('')

    if (!currentUser) {
      setError('Please log in before saving your profile.')
      return
    }

    const trimmedName = form.name.trim()
    if (!trimmedName) {
      setError('Full name is required.')
      return
    }

    if (!selectedSubjects.length) {
      setError('Choose at least one subject to focus on.')
      return
    }

    const trimmedSchool = form.school.trim()
    const nextProfile = {
      name: trimmedName,
      school: trimmedSchool,
      email: form.email || currentUser.email || '',
      grade: form.grade,
      curriculum: form.curriculum,
      subjects: selectedSubjects,
      learningGoals: form.learningGoals.split(',').map((item) => item.trim()).filter(Boolean),
      preferredLearningStyle: form.preferredLearningStyle,
      weakAreas: form.weakAreas.split(',').map((item) => item.trim()).filter(Boolean),
      examinationYear: form.examinationYear ? Number(form.examinationYear) : null
    }
    setSaving(true)

    try {
      await saveUserProfile(nextProfile, nextProfile, 5000)
      setForm((current) => ({ ...current, name: trimmedName, school: trimmedSchool }))
      setStatus('Profile saved.')
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile was not saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10 md:px-10 md:py-12">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-4 shadow-soft sm:rounded-[32px] sm:p-8 lg:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Your Mwenje profile</p>
          <h1 className="mt-4 text-2xl font-display font-semibold sm:text-4xl">Edit your learning profile.</h1>
          <p className="mt-4 max-w-2xl text-text-secondary">
            Keep your profile current so Mwenje can personalise tutoring, quizzes, flashcards, and progress tracking around your focus subjects.
          </p>
          {error ? (
            <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}
          {status ? (
            <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{status}</div>
          ) : null}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 sm:mt-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-text-secondary">Full name</span>
                <input
                  required
                  disabled={loadingProfile || saving}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary disabled:opacity-60"
                  placeholder="Tatenda M"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Email address</span>
                <input
                  disabled
                  type="email"
                  value={form.email}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none opacity-70"
                  placeholder="tatenda@example.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">School</span>
                <input
                  disabled={loadingProfile || saving}
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary disabled:opacity-60"
                  placeholder="Your school"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Grade level</span>
                <select
                  required
                  disabled={loadingProfile || saving}
                  value={form.grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary disabled:opacity-60"
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
                  disabled={loadingProfile || saving}
                  value={form.curriculum}
                  onChange={(e) => setForm({ ...form, curriculum: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary disabled:opacity-60"
                >
                  {curricula.map((curriculum) => (
                    <option key={curriculum} value={curriculum}>{curriculum}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Learning goals</span>
                <input
                  disabled={loadingProfile || saving}
                  value={form.learningGoals}
                  onChange={(e) => setForm({ ...form, learningGoals: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary disabled:opacity-60"
                  placeholder="Pass Maths, improve problem solving"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Preferred learning style</span>
                <select
                  disabled={loadingProfile || saving}
                  value={form.preferredLearningStyle}
                  onChange={(e) => setForm({ ...form, preferredLearningStyle: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary disabled:opacity-60"
                >
                  {['step-by-step examples', 'visual explanations', 'exam practice', 'short summaries'].map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Weak areas</span>
                <input
                  disabled={loadingProfile || saving}
                  value={form.weakAreas}
                  onChange={(e) => setForm({ ...form, weakAreas: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary disabled:opacity-60"
                  placeholder="Simultaneous equations, graphs"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-text-secondary">Examination year</span>
                <input
                  type="number"
                  min={2026}
                  max={2035}
                  disabled={loadingProfile || saving}
                  value={form.examinationYear}
                  onChange={(e) => setForm({ ...form, examinationYear: e.target.value })}
                  className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary disabled:opacity-60"
                  placeholder="2026"
                />
              </label>
            </div>

            <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-display font-semibold text-text-primary">Subjects to focus on</h2>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    These subjects control what appears in your tutor, quizzes, flashcards, and progress pages.
                  </p>
                </div>
                <span className="text-sm font-semibold text-accent-primary">{selectedSubjects.length} selected</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableSubjects.map((subject) => {
                  const isSelected = selectedSubjects.includes(subject)
                  return (
                    <button
                      key={subject}
                      type="button"
                      disabled={loadingProfile || saving}
                      onClick={() => toggleSubject(subject)}
                      className={`rounded-3xl border px-4 py-3 text-left text-sm font-semibold leading-5 transition disabled:opacity-60 sm:px-5 ${
                        isSelected
                          ? 'border-accent-primary bg-[#FFF0E6] text-accent-primary'
                          : 'border-[rgba(28,25,23,0.08)] bg-white text-text-secondary hover:bg-[#fbf2e7]'
                      }`}
                    >
                      {subject}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
              <span className="text-sm text-text-secondary">
                {loadingProfile ? 'Loading your profile...' : status || 'Changes are saved to your Mwenje account.'}
              </span>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  disabled={loadingProfile || saving}
                  className="inline-flex w-full items-center justify-center rounded-full bg-bg-secondary px-6 py-4 text-sm font-semibold text-text-primary transition hover:bg-[#fbf2e7] disabled:opacity-50 sm:w-auto"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loadingProfile || saving}
                  className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26] disabled:opacity-50 sm:w-auto"
                >
                  {saving ? 'Saving...' : loadingProfile ? 'Loading...' : 'Save profile'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
