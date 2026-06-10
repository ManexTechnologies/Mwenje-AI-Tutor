'use client'

import Link from 'next/link'
import { useProfile } from '@/components/profile-provider'
import { getSubscriptionPlan } from '@/lib/subscription'

const freeLimits = ['10 AI tutor messages per day', '3 quizzes per day', 'Credits renew every 24 hours']
const proBenefits = ['Unlimited AI tutor messages', 'Unlimited quizzes and essay reviews', 'Advanced planner with exam sync']

export default function SubscriptionPage() {
  const { user } = useProfile()

  const subscriptionPlan = getSubscriptionPlan(user?.email, user?.subscriptionPlan)
  const isPro = subscriptionPlan === 'pro'

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Subscription</p>
          <h1 className="text-3xl font-display font-semibold text-text-primary sm:text-4xl">Choose your Mwenje plan</h1>
          <p className="max-w-3xl text-text-secondary">
            {isPro ? 'Your Mwenje Pro subscription is active.' : 'Free Trial credits renew every 24 hours. Upgrade when you need more practice, feedback, and tutoring time.'}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-6 shadow-sm sm:rounded-[32px] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-text-secondary">Current plan</p>
            <h2 className="mt-4 text-3xl font-display font-semibold text-text-primary">{isPro ? 'Mwenje Pro' : 'Free Trial'}</h2>
            <ul className="mt-6 space-y-3 text-text-secondary">
              {(isPro ? proBenefits : freeLimits).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href="/dashboard" className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-accent-primary px-6 py-3 text-sm font-semibold text-accent-primary transition hover:bg-[#F8E8D9] sm:w-auto">
              Continue learning
            </Link>
          </div>

          <div className="rounded-[24px] border border-accent-primary bg-[#FFF0E6] p-6 shadow-soft sm:rounded-[32px] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-primary">Paid subscription</p>
            <h2 className="mt-4 text-3xl font-display font-semibold text-text-primary">Mwenje Pro</h2>
            <p className="mt-3 text-text-secondary">$4.99 / month</p>
            <ul className="mt-6 space-y-3 text-text-secondary">
              {proBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-8 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-accent-primary">
                Pro is active for your account.
              </div>
            ) : (
              <button type="button" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26] sm:w-auto">
                Subscribe to Pro
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
