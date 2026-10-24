import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Row } from '@/lib/analytics'
import { compact, num } from '@/lib/format'
import { display } from './ui'

export function StatTile({ label, value, prev, hint, hero }: { label: string; value: number; prev?: number | null; hint?: string; hero?: boolean }) {
  let delta: ReactNode = null
  if (prev !== undefined && prev !== null) {
    const change = prev === 0 ? (value > 0 ? 100 : 0) : ((value - prev) / prev) * 100
    const Icon = change > 0.5 ? ArrowUpRight : change < -0.5 ? ArrowDownRight : Minus
    const tone = change > 0.5 ? 'text-green-800 bg-green-100' : change < -0.5 ? 'text-red-800 bg-red-100' : 'text-black/60 bg-black/5'
    delta = (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-bold ${tone}`} title={`Previous period: ${num(prev)}`}>
        <Icon className="w-3 h-3" aria-hidden />
        {change > 0 ? '+' : ''}
        {Math.round(change)}% <span className="sr-only">vs previous period</span>
      </span>
    )
  }
  return (
    <div className={`border-2 border-black bg-white p-4 sm:p-5 ${hero ? 'shadow-[5px_5px_0_0_#fcb345]' : 'shadow-[4px_4px_0_0_#000]'}`}>
      <p className="text-[11px] font-black uppercase tracking-widest text-black/50" style={display}>
        {label}
      </p>
      <p className={`mt-1 font-black tracking-tighter leading-none ${hero ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl'}`} style={display}>
        {value < 10000 ? num(value) : compact(value)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 min-h-5">
        {delta}
        {hint && <span className="text-[11px] text-black/45">{hint}</span>}
      </div>
    </div>
  )
}

/** Ranked breakdown: label, thin magnitude bar, clicks and visitors. One color for every bar (single series). */
export function Breakdown({
  title,
  rows,
  render,
  empty = 'No data yet',
  href,
}: {
  title: string
  rows: Row[]
  render?: (r: Row) => ReactNode
  empty?: string
  href?: (r: Row) => string | undefined
}) {
  const max = Math.max(1, ...rows.map((r) => r.clicks))
  const total = rows.reduce((s, r) => s + r.clicks, 0) || 1
  return (
    <section className="border-2 border-black bg-white p-4 sm:p-5">
      <h3 className="text-sm sm:text-base font-black mb-3" style={display}>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-black/45 py-6 text-center">{empty}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="sr-only">
            <tr>
              <th>{title}</th>
              <th>Clicks</th>
              <th>Visitors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const link = href?.(r)
              const label = render ? render(r) : r.key
              return (
                <tr key={r.key} className="group">
                  <td className="py-1.5 pr-3 w-full max-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      {link ? (
                        <a href={link} className="truncate font-semibold hover:underline underline-offset-2">
                          {label}
                        </a>
                      ) : (
                        <span className="truncate font-semibold">{label}</span>
                      )}
                      <span className="text-[11px] text-black/40 tabular-nums">{Math.round((r.clicks / total) * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-black/[0.06]">
                      <div className="h-full bg-black rounded-r-[3px] group-hover:bg-[#c97e0e] transition-colors" style={{ width: `${(r.clicks / max) * 100}%` }} />
                    </div>
                  </td>
                  <td className="py-1.5 pl-2 text-right font-black tabular-nums align-top" style={display}>
                    {compact(r.clicks)}
                  </td>
                  <td className="py-1.5 pl-3 text-right text-xs text-black/50 tabular-nums align-top whitespace-nowrap" title="Unique visitors">
                    {compact(r.visitors)} uv
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
