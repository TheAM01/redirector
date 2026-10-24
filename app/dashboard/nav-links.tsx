'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Link2 } from 'lucide-react'
import { display } from '@/components/ui'

const items = [
  { href: '/dashboard', label: 'Analytics', icon: BarChart3, match: (p: string) => p === '/dashboard' },
  { href: '/dashboard/links', label: 'Links', icon: Link2, match: (p: string) => p.startsWith('/dashboard/links') },
]

export function NavLinks() {
  const path = usePathname()
  return items.map(({ href, label, icon: Icon, match }) => (
    <Link
      key={href}
      href={href}
      aria-current={match(path) ? 'page' : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-colors ${
        match(path) ? 'bg-[#fcb345] border-2 border-black text-black' : 'border-2 border-transparent text-black/65 hover:bg-black hover:text-white'
      }`}
      style={display}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </Link>
  ))
}
