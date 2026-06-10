import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-bg-primary px-4 py-10 text-center text-text-primary sm:px-6">
      <div className="max-w-xl rounded-[24px] border border-[rgba(28,25,23,0.08)] bg-white p-6 shadow-soft sm:rounded-[32px] sm:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-accent-secondary">Page not found</p>
        <h1 className="mt-6 text-3xl font-display font-semibold sm:text-4xl">We couldn’t find that page</h1>
        <p className="mt-4 text-text-secondary">Return to the home page and continue your learning journey with Mwenje.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white hover:bg-[#b55a26]">
          Back to home
        </Link>
      </div>
    </main>
  )
}
