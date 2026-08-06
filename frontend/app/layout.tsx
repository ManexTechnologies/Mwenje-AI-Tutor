import './globals.css'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ProfileProvider } from '@/components/profile-provider'
import { SiteNav } from '@/components/site-nav'

const playfair = localFont({
  src: '../public/fonts/playfair-display/6.woff2',
  display: 'swap',
  variable: '--font-display',
  preload: false,
  weight: '400 900'
})

const dmSans = localFont({
  src: '../public/fonts/dm-sans/9.woff2',
  display: 'swap',
  variable: '--font-sans',
  preload: false,
  weight: '100 1000'
})

export const metadata: Metadata = {
  title: {
    default: 'Mwenje — Learn Smart Shine Bright',
    template: '%s · Mwenje'
  },
  description: 'Learn Smart Shine Bright — AI-powered learning for Zimbabwean high school students.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png'
  },
  manifest: '/site.webmanifest'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${playfair.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-bg-primary text-text-primary">
        <ProfileProvider>
          <SiteNav />
          {children}
        </ProfileProvider>
      </body>
    </html>
  )
}
