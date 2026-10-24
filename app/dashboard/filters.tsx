'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Download } from 'lucide-react'
import { display } from '@/components/ui'

/** Date range + link filter. One row above everything it scopes. */
export function Filters({ ranges, links, range, link }: { ranges: { key: string; label: string }[]; links: { slug: string; title: string }[]; range: string; link?: string }) {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  const go = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v === null) p.delete(k)
    else p.set(k, v)
    start(() => router.push(`${path}?${p.toString()}`, { scroll: false }))
  }
  const exportHref = `/api/export?${new URLSearchParams({ range, ...(link !== undefined ? { link } : {}) })}`

  return (
    <div className={`flex flex-wrap items-center gap-3 mb-6 sm:mb-8 transition-opacity ${pending ? 'opacity-60' : ''}`} data-pending={pending || undefined}>
      <div role="radiogroup" aria-label="Date range" className="inline-flex flex-wrap border-2 border-black bg-white">
        {ranges.map((r) => (
          <button
            key={r.key}
            type="button"
            role="radio"
            aria-checked={range === r.key}
            onClick={() => go('range', r.key)}
            className={`px-3 py-2 text-xs font-black uppercase tracking-wider border-r-2 last:border-r-0 border-black transition-colors ${range === r.key ? 'bg-black text-white' : 'hover:bg-[#fcb345]'}`}
            style={display}
          >
            {r.key === 'all' ? 'All' : r.key.toUpperCase()}
            <span className="sr-only"> ({r.label})</span>
          </button>
        ))}
      </div>
      <label className="inline-flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-black/50" style={display}>
          Link
        </span>
        <select
          value={link ?? ''}
          onChange={(e) => go('link', e.target.value === '' ? null : e.target.value)}
          className="border-2 border-black bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:shadow-[3px_3px_0_0_#fcb345] max-w-[240px]"
        >
          <option value="">All links</option>
          {links.map((l) => (
            <option key={l.slug} value={l.slug || '/'}>
              mueed.xyz/{l.slug} {l.title ? `– ${l.title}` : ''}
            </option>
          ))}
        </select>
      </label>
      <a
        href={exportHref}
        className="ml-auto inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
        style={display}
      >
        <Download className="w-3.5 h-3.5" /> Export CSV
      </a>
    </div>
  )
}
