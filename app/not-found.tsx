import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { Button, display } from '@/components/ui'

export const metadata: Metadata = { title: 'Link not found', robots: { index: false, follow: true } }

export default function NotFound() {
  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-20 sm:py-32">
      <div className="relative inline-block group mb-8">
        <div className="absolute -inset-2 bg-black skew-x-9 group-hover:skew-x-4 transition-transform duration-300" />
        <h1 className="relative z-10 text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-none text-white px-4 sm:px-6 py-2" style={display}>
          404
        </h1>
      </div>
      <p className="text-sm sm:text-lg text-black font-black uppercase tracking-widest mb-3" style={display}>
        This short link doesn&apos;t exist.
      </p>
      <p className="text-sm sm:text-base text-black/60 mb-8 max-w-lg">It may have been removed or mistyped. You can find everything from Abdul Mueed here instead:</p>
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <Button href="https://me.mueed.xyz">About me</Button>
        <Button href="https://portfolio.mueed.xyz" variant="accent">
          Portfolio
        </Button>
        <Button href="/" variant="outline" external={false}>
          All links <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </main>
  )
}
