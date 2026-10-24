import type { Metadata } from 'next'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { logout } from '@/app/login/actions'
import { display } from '@/components/ui'
import { NavLinks } from './nav-links'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-black bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="group relative inline-flex items-center gap-2" aria-label="Dashboard home">
            <span className="relative inline-block">
              <span className="absolute -inset-1 bg-black skew-x-9 group-hover:skew-x-4 transition-transform duration-300" />
              <span className="relative z-10 block px-2.5 text-lg sm:text-xl font-black tracking-tighter text-white" style={display}>
                MUEED
              </span>
            </span>
            <span className="hidden sm:inline text-xs font-black uppercase tracking-[0.25em] text-black/45" style={display}>
              / links
            </span>
          </Link>
          <nav aria-label="Dashboard" className="flex items-center gap-1 sm:gap-2">
            <NavLinks />
            <form action={logout}>
              <button
                type="submit"
                className="ml-1 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border-2 border-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                style={display}
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">{children}</main>
    </>
  )
}
