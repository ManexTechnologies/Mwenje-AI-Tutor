'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-3xl px-6 py-16 md:px-10">
        <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-10 shadow-soft">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Forgot password</p>
          <h1 className="mt-4 text-4xl font-display font-semibold">Reset your password</h1>
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
