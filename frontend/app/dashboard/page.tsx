import Link from 'next/link'

const progress = [
  { subject: 'Maths', mastery: 82 },
  { subject: 'English', mastery: 74 },
  { subject: 'Science', mastery: 68 }
]

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-10 flex flex-col gap-5 rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-10 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Good morning, Tatenda</p>
            <h1 className="mt-4 text-4xl font-display font-semibold text-text-primary">Your lamp is lit.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-text-secondary">Here’s your study plan for today, with quick actions and progress across subjects.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-[#FFF4E6] p-6 text-center">
              <p className="text-sm text-text-secondary">Streak</p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">6 days</p>
            </div>
            <div className="rounded-3xl bg-[#E8F6F0] p-6 text-center">
              <p className="text-sm text-text-secondary">XP</p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">1,420</p>
            </div>
            <div className="rounded-3xl bg-[#FFF0E6] p-6 text-center">
              <p className="text-sm text-text-secondary">Next exam</p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">History</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: 'Ask Mwenje', description: 'Get help from the AI tutor in any subject.', href: '/tutor' },
                { title: 'Practice Quiz', description: 'Take a quiz based on your weak topics.', href: '/quiz' },
                { title: 'Essay Review', description: 'Submit an essay for instant feedback.', href: '/essay' }
              ].map((card) => (
                <Link key={card.title} href={card.href} className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white p-6 text-text-primary shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">{card.title}</p>
                  <p className="mt-4 text-lg font-semibold">{card.description}</p>
                </Link>
              ))}
            </div>

            <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Today’s plan</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text-primary">Review Grade 4 maths and History essays</h2>
                </div>
                <p className="text-sm font-semibold text-success">On track</p>
              </div>
              <div className="mt-8 space-y-4">
                {[
                  '10:00 AM – Maths practice: algebra and graphs',
                  '1:00 PM – English essay structure review',
                  '4:00 PM – Past paper questions for History'
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-5 text-text-secondary">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-white p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Subject mastery</p>
              <div className="mt-8 space-y-6">
                {progress.map((item) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between text-sm text-text-secondary">
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
            <div className="rounded-[32px] border border-[rgba(28,25,23,0.08)] bg-[#FFF8E6] p-8 shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Leaderboard</p>
              <div className="mt-6 space-y-4">
                {[
                  { name: 'Simba', xp: 1720 },
                  { name: 'Tariro', xp: 1610 },
                  { name: 'Nyasha', xp: 1540 }
                ].map((user) => (
                  <div key={user.name} className="flex items-center justify-between text-text-primary">
                    <span>{user.name}</span>
                    <span className="font-semibold">{user.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
