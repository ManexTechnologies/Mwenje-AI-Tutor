'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser, type AppUser } from '@/lib/auth'

const features = [
  { title: 'AI Tutor', description: 'Step-by-step explanations, subject guidance, and warm support for every question.' },
  { title: 'Smart Quizzes', description: 'Adaptive practice questions that meet ZIMSEC and Cambridge exam style.' },
  { title: 'Study Planner', description: 'Daily revision schedules built around your exam dates.' },
  { title: 'Essay Feedback', description: 'Structure, grammar, and marking-scheme review for better writing.' }
]

const subjects = ['Maths', 'English', 'Science', 'History', 'Geography', 'Commerce', 'Principles of Accounting', 'Accounting', 'Shona']

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCurrentUser().then((nextUser) => {
      if (cancelled) return
      setUser(nextUser)
      setAuthReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const isSignedIn = authReady && user

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
<div className="space-y-8">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Mwenje logo" className="h-16 w-16 rounded-full object-cover shadow-soft sm:h-20 sm:w-20" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">MWENJE</span>
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">Learn Smart Shine Bright</span>
              </div>
            </div>
<div className="space-y-6">
              <h1 className="text-4xl font-display font-semibold leading-tight tracking-tight text-text-primary sm:text-5xl md:text-6xl">
                Your guiding light to academic excellence
              </h1>
              <p className="max-w-xl text-lg leading-8 text-text-secondary">
                Mwenje helps you learn better, study smarter, and build confidence with AI-powered tutoring, quizzes, essays, and progress tracking.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={isSignedIn ? '/dashboard' : '/sign-up'} className="inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26]">
                {isSignedIn ? 'Continue learning' : 'Start learning for free'}
              </Link>
              <Link href={isSignedIn ? '/subscription' : '#features'} className="inline-flex items-center justify-center rounded-full border border-accent-primary px-6 py-3 text-sm font-semibold text-accent-primary transition hover:bg-[#F8E8D9]">
                {isSignedIn ? 'View subscription' : 'Explore features'}
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-5 shadow-soft sm:rounded-[32px] sm:p-8">
            <div className="absolute right-6 top-6 h-16 w-16 rounded-full bg-accent-secondary opacity-30 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="rounded-3xl border border-[rgba(201,104,42,0.12)] bg-white/80 p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-accent-primary">Mwenje tutor card</p>
                <h2 className="mt-4 text-3xl font-semibold text-text-primary">Ask a question, get a warm explanation.</h2>
                <p className="mt-4 text-text-secondary">I can help with Maths, Science, English, History and more — all tailored to your grade and curriculum.</p>
              </div>
              <div className="rounded-3xl bg-[#FDEEDA] p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-text-secondary">Today’s spark</p>
                <p className="mt-3 text-lg font-semibold text-text-primary">Build a study routine, strengthen weak topics and grow your streak.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-[rgba(28,25,23,0.08)] bg-bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-secondary">Core features</p>
            <h2 className="mt-4 text-3xl font-display font-semibold text-text-primary sm:text-4xl">Built to support every part of your study journey</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-white p-7 shadow-sm">
                <h3 className="text-xl font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-3 text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent-secondary">Subjects supported</p>
            <h2 className="mt-4 text-3xl font-display font-semibold text-text-primary sm:text-4xl">A strong foundation across key subjects</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-text-secondary">From maths and science to English and Shona, Mwenje is designed to match Zimbabwean curricula while being ready to scale globally.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((subject) => (
              <div key={subject} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-white p-5 text-text-primary shadow-sm">
                {subject}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(28,25,23,0.08)] bg-bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-accent-secondary">Pricing</p>
            <h2 className="mt-4 text-3xl font-display font-semibold text-text-primary sm:text-4xl">Free tier plus a smart Pro upgrade</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-text-secondary">Free</p>
              <p className="mt-4 text-4xl font-display font-semibold text-text-primary sm:text-5xl">Free Trial</p>
              <ul className="mt-6 space-y-3 text-text-secondary">
                <li>10 AI tutor messages per day</li>
                <li>3 quizzes per day</li>
                <li>Credits renew every 24 hours</li>
                <li>Basic study planner</li>
                <li>Access to all subjects</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-accent-primary bg-[#FFF0E6] p-8 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-primary">Pro</p>
              <p className="mt-4 text-4xl font-display font-semibold text-text-primary sm:text-5xl">$4.99<span className="text-base font-normal"> / month</span></p>
              <ul className="mt-6 space-y-3 text-text-secondary">
                <li>Unlimited AI tutor messages</li>
                <li>Unlimited quizzes and essay reviews</li>
                <li>Advanced planner with exam sync</li>
                <li>Offline mode and faster responses</li>
              </ul>
              <Link href="/subscription" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26] sm:w-auto">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!isSignedIn ? (
        <section id="signup" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
          <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-6 text-center shadow-soft sm:rounded-[32px] sm:p-10">
            <h2 className="text-3xl font-display font-semibold text-text-primary">Ready to light up your learning?</h2>
            <p className="mt-4 text-text-secondary">Create an account and begin your first study session with Mwenje.</p>
            <div className="mt-8 flex justify-center">
              <Link href="/sign-up" className="inline-flex items-center justify-center rounded-full bg-accent-primary px-8 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26]">
                Start for free
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
