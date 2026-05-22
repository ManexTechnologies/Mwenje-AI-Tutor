'use client'

import { useState } from 'react'

export default function ProfilePage() {
  const [name, setName] = useState('Tatenda')
  const [school, setSchool] = useState('Hillcrest College')
  const [curriculum, setCurriculum] = useState('ZIMSEC')

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-10">
        <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-10 shadow-soft">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Profile settings</p>
            <h1 className="text-4xl font-display font-semibold text-text-primary">Your leerling profile</h1>
            <p className="max-w-2xl text-text-secondary">Update your name, school, and curriculum preferences for a personalised experience.</p>
          </div>
          <form className="mt-10 space-y-6">
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">School</span>
              <input value={school} onChange={(e) => setSchool(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-text-secondary">Curriculum</span>
              <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)} className="mt-2 w-full rounded-3xl border border-[rgba(28,25,23,0.1)] bg-bg-secondary px-4 py-3 text-text-primary outline-none focus:border-accent-secondary">
                <option>ZIMSEC</option>
                <option>Cambridge</option>
                <option>Both</option>
              </select>
            </label>
            <button type="button" className="inline-flex items-center justify-center rounded-full bg-accent-primary px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-[#b55a26]">
              Save changes
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
