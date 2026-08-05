'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { useProfile } from '@/components/profile-provider'

const apiBase = '/backend'

type LeaderboardEntry = {
  uid: string
  name: string
  xpPoints: number
  xp: number
  streakDays: number
  masteryAverage: number
}

export default function LeaderboardPage() {
  const { user, authReady } = useProfile()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authReady || !user) return
    fetchWithAuth(`${apiBase}/leaderboard`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load leaderboard')
        const data = (await res.json()) as { top: LeaderboardEntry[] }
        setEntries(data.top)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load leaderboard'))
  }, [authReady, user])

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Leaderboard</p>
          <h1 className="mt-3 text-3xl font-display font-semibold sm:text-4xl">School rankings</h1>
          <p className="mt-4 max-w-3xl text-text-secondary">Points come from submitted quiz scores. School and national filters are planned on top of this ranking API.</p>

          {authReady && !user ? (
            <div className="mt-8 rounded-3xl bg-bg-secondary p-6 text-text-secondary">
              Log in to see your leaderboard.
              <Link href="/login" className="ml-2 font-semibold text-accent-primary hover:underline">Log in</Link>
            </div>
          ) : null}
          {error ? <div className="mt-8 rounded-3xl bg-bg-secondary p-6 text-text-secondary">{error}</div> : null}

          <div className="mt-8 space-y-3">
            {entries.length ? entries.map((entry, index) => (
              <div key={entry.uid} className="flex items-center justify-between rounded-3xl bg-bg-secondary p-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary text-sm font-semibold text-white">{index + 1}</span>
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-sm text-text-secondary">{entry.streakDays} day streak</p>
                  </div>
                </div>
                <p className="font-semibold">{entry.xp ?? entry.xpPoints} XP</p>
              </div>
            )) : authReady && user ? (
              <div className="rounded-3xl bg-bg-secondary p-6 text-text-secondary">No leaderboard entries yet. Submit a quiz to start ranking.</div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
