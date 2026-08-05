'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@/components/profile-provider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { subjects as allSubjects } from '@/lib/learning'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type StudyPlan = {
  weeklyPlan: Array<{ day: string; focus: string; task: string; hours: number }>
  revisionSchedule: Array<{ when: string; activity: string }>
  priorityTopics: string[]
  generatedAt: string
}

export default function PlannerPage() {
  const { user, authReady, profile } = useProfile()
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics'])
  const [weakSubjects, setWeakSubjects] = useState<string[]>(['Mathematics'])
  const [examDate, setExamDate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    const subjects = profile.subjects.length ? profile.subjects : ['Mathematics']
    setSelectedSubjects(subjects)
    setWeakSubjects(profile.weakAreas.length ? profile.weakAreas : subjects.slice(0, 1))
  }, [profile])

  useEffect(() => {
    if (!authReady || !user) return
    let cancelled = false
    fetchWithAuth(`${apiBase}/ai/planner/latest`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json() as { plan: StudyPlan | null }
        if (!cancelled) setPlan(data.plan)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [authReady, user])

  function toggleSubject(subject: string, setter: (value: string[]) => void, current: string[]) {
    const next = current.includes(subject)
      ? current.filter((item) => item !== subject)
      : [...current, subject]
    setter(next.length ? next : [subject])
  }

  async function generate() {
    if (!user) {
      setStatus('Log in to generate and save your study plan.')
      return
    }

    setLoading(true)
    setStatus('Generating tomorrow and weekly revision plan...')
    try {
      const res = await fetchWithAuth(`${apiBase}/ai/planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: selectedSubjects, weakSubjects, examDate, hoursPerDay })
      })
      if (!res.ok) throw new Error('Could not generate study plan')
      const data = await res.json() as { plan: StudyPlan }
      setPlan(data.plan)
      setStatus('Study plan saved')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not generate study plan')
    } finally {
      setLoading(false)
    }
  }

  const subjectOptions = profile?.subjects.length ? profile.subjects : allSubjects

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Study planner</p>
            <h1 className="text-3xl font-display font-semibold text-text-primary sm:text-4xl">Plan tomorrow&apos;s revision</h1>
            <p className="max-w-3xl text-text-secondary">Generate a ZIMSEC-aligned weekly plan using your subjects, weak areas, exam date, and available study time.</p>
          </div>

          {!user && authReady ? (
            <div className="mt-8 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6 text-text-secondary">
              Log in to generate and save study plans.
              <Link href="/login" className="ml-2 font-semibold text-accent-primary hover:underline">Log in</Link>
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Exam date</span>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Hours available per day</span>
              <input
                type="number"
                min={1}
                max={8}
                step={0.5}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary"
              />
            </label>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-text-secondary">Subjects</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {subjectOptions.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject, setSelectedSubjects, selectedSubjects)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${selectedSubjects.includes(subject) ? 'border-accent-primary bg-[#FFF0E6] text-accent-primary' : 'border-[rgba(28,25,23,0.08)] bg-bg-secondary text-text-secondary'}`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Weak subjects</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSubjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject, setWeakSubjects, weakSubjects)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${weakSubjects.includes(subject) ? 'border-accent-secondary bg-[#FFF8E6] text-accent-primary' : 'border-[rgba(28,25,23,0.08)] bg-bg-secondary text-text-secondary'}`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="button" onClick={generate} disabled={loading} className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {loading ? 'Generating...' : 'Generate plan'}
          </button>

          {status ? <div className="mt-6 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary px-5 py-4 text-sm text-text-secondary">{status}</div> : null}

          {plan ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-5 sm:rounded-[32px] sm:p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Weekly schedule</p>
                <div className="mt-5 space-y-3 text-text-secondary">
                  {plan.weeklyPlan.map((item) => (
                    <div key={`${item.day}-${item.focus}`} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-white p-4">
                      <span className="font-semibold text-text-primary">{item.day}: {item.focus}</span>
                      <p className="mt-2">{item.task}</p>
                      <p className="mt-2 text-sm font-semibold text-accent-primary">{item.hours}h</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 sm:rounded-[32px] sm:p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Priority topics</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan.priorityTopics.map((topic) => <span key={topic} className="rounded-full bg-[#FFF0E6] px-4 py-2 text-sm font-semibold text-accent-primary">{topic}</span>)}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 sm:rounded-[32px] sm:p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Revision schedule</p>
                  <div className="mt-4 space-y-3 text-text-secondary">
                    {plan.revisionSchedule.map((item) => <div key={item.when}><span className="font-semibold text-text-primary">{item.when}</span> - {item.activity}</div>)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
