'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-10">
<div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Mwenje logo" className="h-14 w-14 rounded-full object-cover shadow-sm" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-text-primary">MWENJE</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary">Learn Smart Shine Bright</span>
            </div>
          </div>
          <p className="mt-8 text-sm uppercase tracking-[0.28em] text-accent-secondary">Forgot password</p>
          <h1 className="mt-4 text-3xl font-display font-semibold sm:text-4xl">Reset your password</h1>
          <p className="mt-4 text-text-secondary">Enter your email and we’ll send a secure reset link to help you get back into your account.</p>
          <form className="mt-10 space-y-6">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none transition focus:border-accent-secondary"
                placeholder="tatenda@example.com"
              />
            </label>
            <button type="button" className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-[#b55a26]">
              Send reset link
            </button>
          </form>
          <p className="mt-8 text-center text-text-secondary">
            Remembered your password? <a href="/login" className="font-semibold text-accent-primary hover:underline">Log in</a>
          </p>
        </div>
      </section>
    </main>
  )
}
