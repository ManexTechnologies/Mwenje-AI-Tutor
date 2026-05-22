import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { SiteNav } from '@/components/site-nav'

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-display' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Mwenje — Your guiding light to academic excellence',
  description: 'AI-powered learning for Zimbabwean high school students',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-bg-primary text-text-primary">
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
