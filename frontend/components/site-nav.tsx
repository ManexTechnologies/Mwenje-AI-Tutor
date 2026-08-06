"use client"

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/components/profile-provider'
import { logoutUser } from '@/lib/auth'
import { getSubscriptionLabel, getSubscriptionPlan } from '@/lib/subscription'

const primaryNavItems = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tutor', href: '/tutor' },
  { label: 'Practice', href: '/practice' }
]

const secondaryNavItems = [
  { label: 'Quiz', href: '/quiz' },
  { label: 'Flashcards', href: '/flashcards' },
  { label: 'Essays', href: '/essay' },
  { label: 'Progress', href: '/progress' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Profile', href: '/profile' }
]

const mobileNavItems = [...primaryNavItems, ...secondaryNavItems]

export function SiteNav() {
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { user, profile, refreshAuth } = useProfile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

async function handleSignOut() {
    try {
      await logoutUser()
      await refreshAuth()
      setIsMenuOpen(false)
      router.push('/')
      router.refresh()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Sign out failed', e)
    }
  }

  const displayName = profile?.name || user?.name || user?.email || 'Learner'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M'
  const subscriptionPlan = getSubscriptionPlan(profile?.email || user?.email)
  const subscriptionLabel = getSubscriptionLabel(subscriptionPlan)

  return (
    <nav className="sticky top-0 z-40 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 bg-bg-primary/90 px-3 py-3 backdrop-blur sm:gap-4 sm:px-6 md:px-10">
<Link href="/" className="flex items-center gap-2.5 sm:gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Mwenje logo" className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11" />
        <span className="flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">MWENJE</span>
          <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-primary">Learn Smart Shine Bright</span>
        </span>
      </Link>
      <div className="hidden items-center gap-1 rounded-full border border-[rgba(28,25,23,0.08)] bg-white/85 p-1 shadow-sm backdrop-blur md:flex">
        {primaryNavItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-bg-secondary hover:text-text-primary">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <div ref={menuRef} className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[rgba(28,25,23,0.1)] bg-white text-sm font-semibold text-text-primary shadow-sm transition hover:bg-bg-secondary"
              aria-label="Open user menu"
              aria-expanded={isMenuOpen}
            >
              <span>{initials}</span>
            </button>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-primary">{subscriptionLabel}</span>
            {isMenuOpen ? (
              <div className="absolute right-0 top-full z-20 mt-3 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-[rgba(28,25,23,0.08)] bg-white p-2 shadow-soft">
                <div className="px-3 py-3">
                  <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
                  {user.email ? <p className="mt-1 truncate text-xs text-text-secondary">{user.email}</p> : null}
                  <div className="mt-3 rounded-2xl bg-[#FFF4E6] px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary">{subscriptionLabel}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {subscriptionPlan === 'pro' ? 'Unlimited Pro access is active.' : 'Credits renew every 24 hours.'}
                    </p>
                  </div>
                </div>
                {subscriptionPlan === 'pro' ? null : (
                  <Link
                    href="/subscription"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-accent-primary transition hover:bg-bg-secondary"
                  >
                    Upgrade plan
                  </Link>
                )}
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-text-primary transition hover:bg-bg-secondary"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <Link href="/login" className="rounded-full border border-[rgba(28,25,23,0.08)] bg-white px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-bg-secondary">
              Log in
            </Link>
            <Link href="/sign-up" className="rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b55a26] sm:px-5">
              Sign up
            </Link>
          </>
        )}
      </div>
      <div className="-mx-3 w-[calc(100%+1.5rem)] overflow-x-auto px-3 pb-1 md:hidden">
        <div className="flex w-max gap-1 rounded-full border border-[rgba(28,25,23,0.08)] bg-white/85 p-1 shadow-sm backdrop-blur">
          {mobileNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-bg-secondary hover:text-text-primary">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
