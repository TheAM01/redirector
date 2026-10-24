import { cols } from './db'
import type { Click } from './types'

export const RANGES = {
  '24h': { label: '24 hours', ms: 24 * 3600e3 },
  '7d': { label: '7 days', ms: 7 * 86400e3 },
  '30d': { label: '30 days', ms: 30 * 86400e3 },
  '90d': { label: '90 days', ms: 90 * 86400e3 },
  '1y': { label: '12 months', ms: 365 * 86400e3 },
  all: { label: 'All time', ms: 0 },
} as const
export type RangeKey = keyof typeof RANGES

export const tz = () => process.env.ANALYTICS_TZ || 'UTC'

export const parseRange = (v: string | undefined): RangeKey => (v && v in RANGES ? (v as RangeKey) : '30d')

type Unit = 'hour' | 'day' | 'month'
const FORMATS: Record<Unit, string> = { hour: '%Y-%m-%d %H', day: '%Y-%m-%d', month: '%Y-%m' }

/** Bucket key for a date in the analytics time zone, matching Mongo's $dateToString output. */
function keyOf(d: Date, unit: Unit, zone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  if (unit === 'month') return `${parts.year}-${parts.month}`
  if (unit === 'day') return `${parts.year}-${parts.month}-${parts.day}`
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}`
}

function bucketKeys(from: Date, to: Date, unit: Unit, zone: string) {
  const step = unit === 'hour' ? 3600e3 : 6 * 3600e3
  const keys: string[] = []
  for (let t = from.getTime(); t <= to.getTime(); t += step) {
    const k = keyOf(new Date(t), unit, zone)
    if (keys[keys.length - 1] !== k) keys.push(k)
  }
  const last = keyOf(to, unit, zone)
  if (keys[keys.length - 1] !== last) keys.push(last)
  return keys
}

export type Row = { key: string; clicks: number; visitors: number }
type Agg = { _id: unknown; n: number; v: number }

const top = (field: string, limit = 10) => [
  { $group: { _id: `$${field}`, n: { $sum: 1 }, v: { $addToSet: '$visitor' } } },
  { $project: { n: 1, v: { $size: '$v' } } },
  { $sort: { n: -1, _id: 1 } },
  { $limit: limit },
]

const rows = (a: Agg[] | undefined, fallback = 'Unknown'): Row[] =>
  (a ?? []).map((r) => ({ key: (typeof r._id === 'string' && r._id) || fallback, clicks: r.n, visitors: r.v }))

export async function getAnalytics(range: RangeKey, slug?: string) {
  const { clicks } = await cols()
  const zone = tz()
  const to = new Date()
  const base: Record<string, unknown> = slug !== undefined ? { slug } : {}

  let from: Date
  if (range === 'all') {
    const first = await clicks.find(base, { projection: { ts: 1 } }).sort({ ts: 1 }).limit(1).next()
    from = first?.ts ?? new Date(to.getTime() - 30 * 86400e3)
  } else from = new Date(to.getTime() - RANGES[range].ms)

  const span = to.getTime() - from.getTime()
  const unit: Unit = span <= 8 * 86400e3 ? 'hour' : span <= 400 * 86400e3 ? 'day' : 'month'
  const match = { ...base, bot: false, ts: { $gte: from, $lte: to } }

  const [facet] = await clicks
    .aggregate<Record<string, Agg[]>>([
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'n' }],
          uniques: [{ $group: { _id: '$visitor' } }, { $count: 'n' }],
          series: [
            { $group: { _id: { $dateToString: { date: '$ts', format: FORMATS[unit], timezone: zone } }, n: { $sum: 1 }, v: { $addToSet: '$visitor' } } },
            { $project: { n: 1, v: { $size: '$v' } } },
          ],
          heat: [{ $group: { _id: { d: { $dayOfWeek: { date: '$ts', timezone: zone } }, h: { $hour: { date: '$ts', timezone: zone } } }, n: { $sum: 1 } } }],
          links: top('slug', 50),
          referrers: top('refHost', 15),
          countries: top('country', 15),
          cities: [
            { $match: { city: { $ne: '' } } },
            { $group: { _id: { $concat: ['$city', '|', '$country'] }, n: { $sum: 1 }, v: { $addToSet: '$visitor' } } },
            { $project: { n: 1, v: { $size: '$v' } } },
            { $sort: { n: -1 } },
            { $limit: 15 },
          ],
          browsers: top('browser'),
          os: top('os'),
          devices: top('device'),
          languages: top('lang'),
          utmSources: [{ $match: { utmSource: { $ne: '' } } }, ...top('utmSource')],
          utmCampaigns: [{ $match: { utmCampaign: { $ne: '' } } }, ...top('utmCampaign')],
        },
      },
    ])
    .toArray()

  // Same-length window before this one, for the "vs previous period" deltas
  const prevFrom = new Date(from.getTime() - span)
  const [prev] = range === 'all' ? [] : await clicks
    .aggregate<{ total: { n: number }[]; uniques: { n: number }[] }>([
      { $match: { ...base, bot: false, ts: { $gte: prevFrom, $lt: from } } },
      { $facet: { total: [{ $count: 'n' }], uniques: [{ $group: { _id: '$visitor' } }, { $count: 'n' }] } },
    ])
    .toArray()

  const [bots, recent] = await Promise.all([
    clicks.countDocuments({ ...base, bot: true, ts: { $gte: from, $lte: to } }),
    clicks.find({ ...base, ts: { $gte: from, $lte: to } }).sort({ ts: -1 }).limit(30).toArray(),
  ])

  const byKey = new Map(rows(facet?.series).map((r) => [r.key, r]))
  const series = bucketKeys(from, to, unit, zone).map((k) => byKey.get(k) ?? { key: k, clicks: 0, visitors: 0 })

  // heat[weekday 0=Mon..6=Sun][hour 0..23]
  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  for (const c of facet?.heat ?? []) {
    const { d, h } = c._id as { d: number; h: number }
    heat[(d + 5) % 7][h] = c.n
  }

  const total = facet?.total?.[0]?.n ?? 0
  const visitors = facet?.uniques?.[0]?.n ?? 0
  const days = Math.max(1, span / 86400e3)

  return {
    range,
    slug,
    from,
    to,
    unit,
    zone,
    total,
    visitors,
    bots,
    perDay: total / days,
    prev: prev ? { total: prev.total[0]?.n ?? 0, visitors: prev.uniques[0]?.n ?? 0 } : null,
    series,
    heat,
    links: rows(facet?.links, '/'),
    referrers: rows(facet?.referrers, 'Direct / none'),
    countries: rows(facet?.countries),
    cities: rows(facet?.cities),
    browsers: rows(facet?.browsers),
    os: rows(facet?.os),
    devices: rows(facet?.devices),
    languages: rows(facet?.languages),
    utmSources: rows(facet?.utmSources),
    utmCampaigns: rows(facet?.utmCampaigns),
    recent: recent as Click[],
  }
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>

/** All-time and last-7-day click counts per link, for the links table. */
export async function linkCounts() {
  const { clicks } = await cols()
  const week = new Date(Date.now() - 7 * 86400e3)
  const res = await clicks
    .aggregate<{ _id: string; all: number; week: number; last: Date }>([
      { $match: { bot: false } },
      { $group: { _id: '$slug', all: { $sum: 1 }, week: { $sum: { $cond: [{ $gte: ['$ts', week] }, 1, 0] } }, last: { $max: '$ts' } } },
    ])
    .toArray()
  return new Map(res.map((r) => [r._id, r]))
}
