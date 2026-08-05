'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '@/components/profile-provider'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { subjectTopics, subjects as allSubjects } from '@/lib/learning'
import type { LearningProfile } from '@/lib/profile'

type SubjectProgress = {
  subject: string
  mastery: number
}

type ProgressResponse = {
  mastery: Array<{ subject: string; score: number }>
  masteryAverage: number
  streakDays: number
  xpPoints: number
  recentQuizzes?: Array<{ subject: string; topic: string; score: number; createdAt: string }>
}

const apiBase = '/backend'

const defaultProfile: LearningProfile = {
  name: 'Learner',
  email: '',
  school: '',
  grade: '',
  curriculum: 'ZIMSEC',
  subjects: ['Mathematics', 'English Language'],
  learningGoals: ['Improve exam performance'],
  preferredLearningStyle: 'step-by-step examples',
  weakAreas: [],
  examinationYear: null
}

function getGreeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-ZW', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-ZW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}

function getFirstName(profile: LearningProfile) {
  return profile.name.trim().split(/\s+/)[0] || 'Learner'
}

function getProfileSubjectFallback(profile: LearningProfile) {
  return profile.subjects.length ? profile.subjects : allSubjects.slice(0, 4)
}

function buildSubjectProgress(profile: LearningProfile): SubjectProgress[] {
  return getProfileSubjectFallback(profile).slice(0, 6).map((subject, index) => ({
    subject,
    mastery: Math.max(45, 78 - index * 7)
  }))
}

function buildTodayPlan(profile: LearningProfile) {
  const profileSubjects = getProfileSubjectFallback(profile)
  const firstSubject = profileSubjects[0] || 'Maths'
  const secondSubject = profileSubjects[1] || firstSubject
  const thirdSubject = profileSubjects[2] || secondSubject

  return [
    {
      time: 'Now',
      task: `${firstSubject} warm-up: ${subjectTopics[firstSubject]?.[0] || 'core concepts'}`
    },
    {
      time: 'Next',
      task: `${secondSubject} practice: ${subjectTopics[secondSubject]?.[1] || 'exam questions'}`
    },
    {
      time: 'Later',
      task: `${thirdSubject} review: ${subjectTopics[thirdSubject]?.[2] || 'revision notes'}`
    }
  ]
}

export default function DashboardPage() {
  const { user: currentUser, profile: loadedProfile, loadingProfile, profileError } = useProfile()
  const [now, setNow] = useState<Date | null>(null)
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const profile = loadedProfile || defaultProfile

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    fetchWithAuth(`${apiBase}/progress`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json() as ProgressResponse
        if (!cancelled) setProgress(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [currentUser])

  const firstName = getFirstName(profile)
  const profileSubjects = useMemo(() => getProfileSubjectFallback(profile), [profile])
  const subjectProgress = useMemo(() => {
    if (progress?.mastery.length) {
      return progress.mastery.map((item) => ({ subject: item.subject, mastery: item.score }))
    }
    return buildSubjectProgress(profile)
  }, [profile, progress])
  const todayPlan = useMemo(() => buildTodayPlan(profile), [profile])
  const gradeLabel = profile.grade || 'Grade not set'
  const subjectSummary = profileSubjects.slice(0, 3).join(', ')
  const remainingSubjects = Math.max(0, profileSubjects.length - 3)

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 md:px-10 md:py-12">
        <div className="mb-6 flex flex-col gap-5 rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-4 shadow-soft sm:mb-8 sm:rounded-[32px] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">
              {now ? getGreeting(now) : 'Welcome'}, {firstName}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#E8F6F0] px-3 py-1 text-sm font-semibold text-[#1D6B4A]">
                {currentUser?.subscriptionPlan === 'pro' ? 'Subscribed' : 'Free trial'}
              </span>
              {currentUser?.subscriptionPlan === 'pro' ? (
                <span className="text-sm font-semibold text-accent-primary">Unlimited tutor access</span>
              ) : null}
            </div>
            <h1 className="mt-4 text-2xl font-display font-semibold text-text-primary sm:text-4xl">
              {profile.grade ? `${profile.grade} dashboard` : 'Your learning dashboard'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
              Focused on {subjectSummary}{remainingSubjects ? ` and ${remainingSubjects} more` : ''}. Lessons and actions are aligned with your profile.
            </p>
            {profileError ? <p className="mt-4 text-sm font-semibold text-accent-primary">{profileError}</p> : null}
            {currentUser && !profile.grade && !profileError ? <p className="mt-4 text-sm font-semibold text-accent-primary">Complete your profile to personalize grade and subject details.</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <div className="min-w-0 rounded-3xl bg-[#FFF4E6] p-4 text-center sm:p-5">
              <p className="text-sm text-text-secondary">Today</p>
              <p className="mt-3 text-lg font-semibold leading-7 text-text-primary">{now ? formatDate(now) : '--'}</p>
            </div>
            <div className="min-w-0 rounded-3xl bg-[#E8F6F0] p-4 text-center sm:p-5">
              <p className="text-sm text-text-secondary">Live time</p>
              <p className="mt-3 whitespace-nowrap text-xl font-semibold leading-tight tabular-nums text-text-primary sm:text-2xl">{now ? formatTime(now) : '--:--:--'}</p>
            </div>
            <div className="min-w-0 rounded-3xl bg-[#FFF0E6] p-4 text-center sm:p-5">
              <p className="text-sm text-text-secondary">Grade</p>
              <p className="mt-3 text-2xl font-semibold text-text-primary sm:text-3xl">{gradeLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: 'Ask Mwenje', description: `Get help in ${profileSubjects[0] || 'your subjects'}.`, href: '/tutor' },
                { title: 'Practice Quiz', description: `Revise ${profileSubjects[1] || profileSubjects[0] || 'a focus subject'} questions.`, href: '/quiz' },
                { title: 'Essay Review', description: `Improve writing for ${profileSubjects[2] || 'your curriculum'}.`, href: '/essay' }
              ].map((card) => (
                <Link key={card.title} href={card.href} className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 text-text-primary shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-[28px] sm:p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">{card.title}</p>
                  <p className="mt-4 text-lg font-semibold">{card.description}</p>
                </Link>
              ))}
            </div>

            <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Today&apos;s plan</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                    {loadingProfile ? 'Loading your study plan' : `${firstName}'s ${gradeLabel} study focus`}
                  </h2>
                </div>
                <p className="text-sm font-semibold text-success">{currentUser ? profile.curriculum : 'Guest mode'}</p>
              </div>
              <div className="mt-6 space-y-4 sm:mt-8">
                {todayPlan.map((item) => (
                  <div key={`${item.time}-${item.task}`} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-4 text-text-secondary sm:p-5">
                    <span className="font-semibold text-text-primary">{item.time}</span> - {item.task}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-sm">
                <p className="text-sm text-text-secondary">XP</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{progress?.xpPoints || 0}</p>
              </div>
              <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-sm">
                <p className="text-sm text-text-secondary">Streak</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{progress?.streakDays || 0}d</p>
              </div>
              <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-sm">
                <p className="text-sm text-text-secondary">Mastery</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{progress?.masteryAverage || 0}%</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-8">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Your subjects</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {profileSubjects.map((subject) => (
                  <span key={subject} className="rounded-full bg-[#FFF0E6] px-4 py-2 text-sm font-semibold text-accent-primary">
                    {subject}
                  </span>
                ))}
              </div>
              <div className="mt-8 space-y-6">
                {subjectProgress.map((item) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between gap-4 text-sm text-text-secondary">
                      <span>{item.subject}</span>
                      <span className="font-semibold text-text-primary">{item.mastery}%</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-[#F3E3D7]">
                      <div className="h-3 rounded-full bg-accent-primary" style={{ width: `${item.mastery}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-[#FFF8E6] p-5 shadow-sm sm:rounded-[32px] sm:p-8">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Profile</p>
              <div className="mt-6 space-y-4 text-text-primary">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-text-secondary">Name</span>
                  <span className="text-right font-semibold">{profile.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-text-secondary">Grade</span>
                  <span className="text-right font-semibold">{gradeLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-text-secondary">Curriculum</span>
                  <span className="text-right font-semibold">{profile.curriculum}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-text-secondary">Subscription</span>
                  <span className={`text-right font-semibold ${currentUser?.subscriptionPlan === 'pro' ? 'text-[#1D6B4A]' : 'text-text-primary'}`}>
                    {currentUser?.subscriptionPlan === 'pro' ? 'Subscribed' : 'Free trial'}
                  </span>
                </div>
                {profile.school ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-text-secondary">School</span>
                    <span className="text-right font-semibold">{profile.school}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
