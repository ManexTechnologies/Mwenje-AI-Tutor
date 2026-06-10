export default function TeacherPage() {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16">
        <div className="rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-5 shadow-soft sm:rounded-[32px] sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Teacher dashboard</p>
          <h1 className="mt-4 text-3xl font-display font-semibold text-text-primary sm:text-4xl">Class progress and student support</h1>
          <p className="mt-4 max-w-3xl text-text-secondary">View your class overview, assign practice quizzes, and identify struggling students using simple teacher tools.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Class average</p>
              <p className="mt-4 text-3xl font-semibold text-text-primary">74%</p>
            </div>
            <div className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Flagged students</p>
              <p className="mt-4 text-3xl font-semibold text-text-primary">4</p>
            </div>
            <div className="rounded-3xl border border-[rgba(28,25,23,0.08)] bg-bg-secondary p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-secondary">Weekly growth</p>
              <p className="mt-4 text-3xl font-semibold text-text-primary">+9%</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
