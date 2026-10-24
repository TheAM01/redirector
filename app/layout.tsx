import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://mueed.xyz'),
  title: { default: 'Abdul Mueed — Links', template: '%s | mueed.xyz' },
  description: 'Short links for Abdul Mueed: portfolio, GitHub, LinkedIn, music and more.',
  authors: [{ name: 'Abdul Mueed', url: 'https://me.mueed.xyz' }],
  alternates: { canonical: '/' },
}

export const viewport: Viewport = { themeColor: '#ffffff' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background text-foreground overflow-x-clip texture-grid-me">{children}</div>
      </body>
    </html>
  )
}
