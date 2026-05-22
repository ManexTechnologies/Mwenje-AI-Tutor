import Link from 'next/link'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tutor', href: '/tutor' },
  { label: 'Quiz', href: '/quiz' },
  { label: 'Progress', href: '/progress' },
  { label: 'Profile', href: '/profile' }
]

export function SiteNav() {
  return (
    <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
      <Link href="/" className="text-lg font-semibold tracking-tight text-text-primary">
        mwenje
      </Link>
      <div className="hidden items-center gap-6 md:flex">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="text-sm font-medium text-text-secondary transition hover:text-text-primary">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" className="rounded-full border border-[rgba(28,25,23,0.08)] bg-white px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-bg-secondary">
          Log in
        </Link>
        <Link href="/sign-up" className="rounded-full bg-accent-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#b55a26]">
          Sign up
        </Link>
      </div>
    </nav>
  )
}
