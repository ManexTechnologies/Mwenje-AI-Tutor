'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useProfile } from '@/components/profile-provider'

type SubjectProgress = {
  subject: string
  score: number
  attempts: number
  lastScore: number
  lastUpdated: string
}

type ProgressResponse = {
  mastery: SubjectProgress[]
  masteryAverage: number
  streakDays: number
  xpPoints: number
}

type LeaderboardEntry = {
  uid: string
  name: string
  xp: number
  masteryAverage: number
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ProgressPage() {
  const { user, authReady } = useProfile()
  const [selected, setSelected] = useState('Maths')
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authReady) return

    if (!user) {
      setProgress(null)
      setLeaderboard([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      fetchWithAuth(`${apiBase}/progress`),
      fetchWithAuth(`${apiBase}/leaderboard`)
    ])
      .then(async ([progressRes, leaderboardRes]) => {
        if (!progressRes.ok) throw new Error('Could not load progress')
        if (!leaderboardRes.ok) throw new Error('Could not load leaderboard')

        const progressData = (await progressRes.json()) as ProgressResponse
        const leaderboardData = (await leaderboardRes.json()) as { top: LeaderboardEntry[] }
        if (cancelled) return
        setProgress(progressData)
        setLeaderboard(leaderboardData.top)
        if (progressData.mastery[0]?.subject) {
          setSelected(progressData.mastery[0].subject)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load progress')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authReady, user])

  const selectedProgress = useMemo(() => {
    return progress?.mastery.find((entry) => entry.subject === selected)
  }, [progress, selected])

  const subjectOptions = progress?.mastery.length ? progress.mastery.map((entry) => entry.subject) : ['Maths', 'English', 'Science']

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Progress tracker</p>
              <h1 className="mt-2 text-3xl font-display font-semibold text-text-primary sm:text-4xl">See your growth over time</h1>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Subject</span>
              <select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary md:w-auto">
                {subjectOptions.map((subject) => (
                  <option key={subject}>{subject}</option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
          {!loading && !user ? (
            <div className="mt-8 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6 text-text-secondary">
              Log in to load your progress, leaderboard ranking, and saved quiz results.
              <Link href="/login" className="ml-2 font-semibold text-accent-primary hover:underline">Log in</Link>
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-[#FFF8E6] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Mastery score</p>
              <p className="mt-4 text-4xl font-semibold text-text-primary sm:text-5xl">{loading ? '--' : `${selectedProgress?.score || 0}%`}</p>
              <p className="mt-2 text-text-secondary">{selectedProgress ? `${selectedProgress.attempts} quiz attempt${selectedProgress.attempts === 1 ? '' : 's'} recorded in ${selected}.` : `No recorded attempts in ${selected} yet.`}</p>
            </div>
            <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">XP points</p>
              <p className="mt-4 text-4xl font-semibold text-text-primary sm:text-5xl">{loading ? '--' : progress?.xpPoints || 0}</p>
              <p className="mt-2 text-text-secondary">Earned from submitted quiz scores.</p>
            </div>
            <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Active streak</p>
              <p className="mt-4 text-4xl font-semibold text-text-primary sm:text-5xl">{loading ? '--' : `${progress?.streakDays || 0}d`}</p>
              <p className="mt-2 text-text-secondary">Keep your momentum going.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_0.95fr]">
            <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-[#FDF8F1] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Subject mastery</p>
              <div className="mt-6 space-y-4">
                {progress?.mastery.length ? progress.mastery.map((entry) => (
                  <div key={entry.subject} className="rounded-3xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 text-text-primary">
                      <span>{entry.subject}</span>
                      <span className="font-semibold">{entry.score}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-bg-secondary">
                      <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${entry.score}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-3xl bg-white p-4 text-text-secondary shadow-sm">Submit a quiz result to start tracking mastery.</div>
                )}
              </div>
            </div>
            <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Leaderboard</p>
              <div className="mt-6 grid gap-4">
                {leaderboard.length ? leaderboard.map((entry, index) => (
                  <div key={entry.uid} className="flex items-center justify-between gap-3 rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-4 text-text-primary">
                    <span>{index + 1}. {entry.name}</span>
                    <span className="font-semibold">{entry.xp} XP</span>
                  </div>
                )) : (
                  <div className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-4 text-text-secondary">No leaderboard scores yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
