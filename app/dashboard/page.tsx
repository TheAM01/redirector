import Link from 'next/link'
import { Bot, ExternalLink } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getAnalytics, parseRange, RANGES, type Analytics } from '@/lib/analytics'
import { cols } from '@/lib/db'
import { ensureSeeded, shortUrl } from '@/lib/links'
import { countryName, dateTime, flag, languageName, num, timeAgo } from '@/lib/format'
import { ClicksChart, Heatmap } from '@/components/charts'
import { Breakdown, StatTile } from '@/components/stats'
import { display } from '@/components/ui'
import { Filters } from './filters'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ range?: string; link?: string }> }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Human labels for a bucket key ('2026-10-24 14' / '2026-10-24' / '2026-10'). */
function labels(key: string, unit: Analytics['unit']) {
  const [date, hour] = key.split(' ')
  const [y, m, d] = date.split('-').map(Number)
  const day = `${d} ${MONTHS[m - 1]}`
  if (unit === 'hour') return { label: `${day} ${y}, ${hour}:00`, short: hour === '00' ? day : `${hour}:00` }
  if (unit === 'day') return { label: `${day} ${y}`, short: day }
  return { label: `${MONTHS[m - 1]} ${y}`, short: `${MONTHS[m - 1]} ${String(y).slice(2)}` }
}

export default async function Overview({ searchParams }: Props) {
  await requireAuth()
  const sp = await searchParams
  const range = parseRange(sp.range)
  const slug = sp.link === undefined ? undefined : sp.link === '/' ? '' : sp.link

  await ensureSeeded()
  const [a, allLinks] = await Promise.all([
    getAnalytics(range, slug),
    cols().then(({ links }) => links.find({}, { projection: { slug: 1, title: 1 } }).sort({ slug: 1 }).toArray()),
  ])
  const series = a.series.map((r) => ({ ...r, ...labels(r.key, a.unit) }))
  const bestHour = a.heat.flatMap((row, d) => row.map((n, h) => ({ d, h, n }))).sort((x, y) => y.n - x.n)[0]
  const linkHref = (key: string) => `/dashboard?${new URLSearchParams({ range, link: key })}`
  const current = slug !== undefined ? allLinks.find((l) => l.slug === slug) : undefined

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-black/40 mb-1" style={display}>
            Analytics · {RANGES[range].label}
          </p>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight" style={display}>
            {slug === undefined ? 'All links' : `mueed.xyz/${slug}`}
          </h1>
          {current && (
            <p className="mt-1 text-sm text-black/55">
              {current.title} ·{' '}
              <Link href={`/dashboard/links/${encodeURIComponent(slug || '~root')}`} className="font-bold underline underline-offset-2">
                Edit link
              </Link>
            </p>
          )}
        </div>
      </div>

      <Filters ranges={Object.entries(RANGES).map(([key, r]) => ({ key, label: r.label }))} links={allLinks.map((l) => ({ slug: l.slug, title: l.title }))} range={range} link={sp.link} />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatTile hero label="Clicks" value={a.total} prev={a.prev?.total} hint={a.prev ? 'vs previous period' : undefined} />
        <StatTile label="Unique visitors" value={a.visitors} prev={a.prev?.visitors} />
        <StatTile label="Clicks per day" value={Math.round(a.perDay * 10) / 10} hint={`${num(a.total)} over ${RANGES[range].label.toLowerCase()}`} />
        <StatTile label="Bot hits filtered" value={a.bots} hint="Crawlers & link previews, not counted" />
      </div>

      {/* Time series */}
      <section className="border-2 border-black bg-white p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-black" style={display}>
            Clicks over time
          </h2>
          <p className="text-xs text-black/45">
            Per {a.unit} · {a.zone}
          </p>
        </div>
        <ClicksChart data={series} />
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-black/55 hover:text-black" style={display}>
            View as table
          </summary>
          <div className="mt-3 max-h-72 overflow-auto border-2 border-black">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-black text-white text-left">
                <tr>
                  <th className="px-3 py-2 font-bold">{a.unit === 'hour' ? 'Hour' : a.unit === 'day' ? 'Day' : 'Month'}</th>
                  <th className="px-3 py-2 font-bold text-right">Clicks</th>
                  <th className="px-3 py-2 font-bold text-right">Visitors</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...series].reverse().map((r) => (
                  <tr key={r.key} className="border-t border-black/10">
                    <td className="px-3 py-1.5">{r.label}</td>
                    <td className="px-3 py-1.5 text-right font-bold">{num(r.clicks)}</td>
                    <td className="px-3 py-1.5 text-right">{num(r.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* Links + heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Breakdown
          title={slug === undefined ? 'Top links' : 'This link'}
          rows={a.links}
          render={(r) => <>mueed.xyz/{r.key === '/' ? '' : r.key}</>}
          href={(r) => linkHref(r.key)}
          empty="No clicks in this range yet"
        />
        <section className="border-2 border-black bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h3 className="text-sm sm:text-base font-black" style={display}>
              When people click
            </h3>
            {bestHour && bestHour.n > 0 && (
              <p className="text-xs text-black/55">
                Busiest: <strong className="text-black">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][bestHour.d]} {String(bestHour.h).padStart(2, '0')}:00</strong>
              </p>
            )}
          </div>
          <Heatmap heat={a.heat} zone={a.zone} />
        </section>
      </div>

      {/* Breakdowns */}
      <h2 className="text-lg sm:text-xl font-black mb-4" style={display}>
        Where clicks come from
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Breakdown title="Referrers" rows={a.referrers} />
        <Breakdown
          title="Countries"
          rows={a.countries}
          render={(r) => (
            <>
              <span aria-hidden>{flag(r.key)}</span> {countryName(r.key)}
            </>
          )}
          empty="No location data (only available on Vercel)"
        />
        <Breakdown
          title="Cities"
          rows={a.cities}
          render={(r) => {
            const [city, cc] = r.key.split('|')
            return (
              <>
                <span aria-hidden>{flag(cc)}</span> {city}
              </>
            )
          }}
          empty="No location data (only available on Vercel)"
        />
        <Breakdown title="UTM source" rows={a.utmSources} empty="Add ?utm_source=… or ?ref=… to a link" />
        <Breakdown title="UTM campaign" rows={a.utmCampaigns} empty="Add ?utm_campaign=… to a link" />
        <Breakdown title="Languages" rows={a.languages} render={(r) => languageName(r.key)} />
      </div>

      <h2 className="text-lg sm:text-xl font-black mb-4" style={display}>
        Devices
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Breakdown title="Device type" rows={a.devices} render={(r) => r.key[0].toUpperCase() + r.key.slice(1)} />
        <Breakdown title="Browser" rows={a.browsers} />
        <Breakdown title="Operating system" rows={a.os} />
      </div>

      {/* Recent */}
      <section className="border-2 border-black bg-white">
        <div className="flex items-baseline justify-between gap-2 p-4 sm:p-5 pb-3">
          <h2 className="text-base sm:text-lg font-black" style={display}>
            Recent clicks
          </h2>
          <p className="text-xs text-black/45">Latest 30, including bots</p>
        </div>
        {a.recent.length === 0 ? (
          <p className="text-sm text-black/45 px-5 pb-8 text-center">Nothing yet. Share a link!</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-black text-white text-left text-xs uppercase tracking-wider">
                <tr>
                  {['When', 'Link', 'Location', 'Referrer', 'Device', 'Browser / OS'].map((h) => (
                    <th key={h} className="px-4 py-2 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.recent.map((c) => (
                  <tr key={String(c._id)} className={`border-t border-black/10 ${c.bot ? 'text-black/40' : ''}`}>
                    <td className="px-4 py-2" title={dateTime(c.ts, a.zone)}>
                      {timeAgo(c.ts)}
                    </td>
                    <td className="px-4 py-2 font-bold">
                      <a href={shortUrl(c.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        /{c.slug} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      {c.country ? (
                        <>
                          <span aria-hidden>{flag(c.country)}</span> {[c.city, countryName(c.country)].filter(Boolean).join(', ')}
                        </>
                      ) : (
                        <span className="text-black/40">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-2 max-w-[220px] truncate" title={c.referrer}>
                      {c.refHost || <span className="text-black/40">Direct</span>}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      {c.bot ? (
                        <span className="inline-flex items-center gap-1 border border-black/30 px-1.5 text-[11px] font-bold uppercase">
                          <Bot className="w-3 h-3" /> Bot
                        </span>
                      ) : (
                        c.device
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {c.browser} · {c.os}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
