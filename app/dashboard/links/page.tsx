import Link from 'next/link'
import { BarChart3, ExternalLink, Pencil } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { cols } from '@/lib/db'
import { linkCounts } from '@/lib/analytics'
import { ensureSeeded, shortUrl } from '@/lib/links'
import { compact, timeAgo } from '@/lib/format'
import { CopyButton } from '@/components/copy-button'
import { display } from '@/components/ui'
import { LinkForm } from './link-form'
import { createLink } from './actions'

export const dynamic = 'force-dynamic'

const Badge = ({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'accent' | 'off' }) => (
  <span
    className={`inline-block border-2 px-1.5 text-[10px] font-black uppercase tracking-wider ${
      tone === 'accent' ? 'border-black bg-[#fcb345]' : tone === 'off' ? 'border-black/30 text-black/45' : 'border-black'
    }`}
    style={display}
  >
    {children}
  </span>
)

export default async function LinksPage() {
  await requireAuth()
  await ensureSeeded()
  const { links } = await cols()
  const [all, counts] = await Promise.all([links.find({}).sort({ slug: 1 }).toArray(), linkCounts()])

  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-black/40 mb-1" style={display}>
        {all.length} links
      </p>
      <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-6 sm:mb-8" style={display}>
        Links
      </h1>

      <section className="relative mb-8 sm:mb-10">
        <div className="absolute inset-0 bg-[#fcb345] translate-x-2 translate-y-2 border-2 border-black" aria-hidden />
        <div className="relative border-2 border-black bg-white p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-black mb-4" style={display}>
            New short link
          </h2>
          <LinkForm action={createLink} mode="create" />
        </div>
      </section>

      <div className="relative border-2 border-black bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black text-white text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5 font-bold">Short link</th>
              <th className="px-4 py-2.5 font-bold">Destination</th>
              <th className="px-4 py-2.5 font-bold text-right">7 days</th>
              <th className="px-4 py-2.5 font-bold text-right">All time</th>
              <th className="px-4 py-2.5 font-bold">Last click</th>
              <th className="px-4 py-2.5 font-bold sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {all.map((l) => {
              const c = counts.get(l.slug)
              const id = encodeURIComponent(l.slug || '~root')
              return (
                <tr key={l.slug} className={`border-t-2 border-black/10 align-top hover:bg-[#fcb345]/10 ${l.enabled ? '' : 'opacity-55'}`}>
                  <td className="px-4 py-3 min-w-[220px]">
                    <Link href={`/dashboard/links/${id}`} className="font-black text-base hover:underline underline-offset-2" style={display}>
                      mueed.xyz/{l.slug}
                    </Link>
                    <p className="text-xs text-black/55">{l.title || '—'}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {!l.enabled && <Badge tone="off">Disabled</Badge>}
                      {l.slug === '' && <Badge tone="accent">Root</Badge>}
                      {l.listed && <Badge>Public</Badge>}
                      <Badge tone={l.permanent ? 'accent' : 'plain'}>{l.permanent ? '301' : '302'}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[320px]">
                    <a href={l.target} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 break-all text-black/75 hover:text-black hover:underline">
                      {l.target.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right font-black tabular-nums" style={display}>
                    {compact(c?.week ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{compact(c?.all ?? 0)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-black/60">{c?.last ? timeAgo(c.last) : 'Never'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <CopyButton text={shortUrl(l.slug)} />
                      <Link href={`/dashboard?link=${encodeURIComponent(l.slug || '/')}`} className="inline-flex items-center border-2 border-black p-1 hover:bg-black hover:text-white" aria-label={`Analytics for mueed.xyz/${l.slug}`} title="Analytics">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Link>
                      <Link href={`/dashboard/links/${id}`} className="inline-flex items-center border-2 border-black p-1 hover:bg-black hover:text-white" aria-label={`Edit mueed.xyz/${l.slug}`} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
