import { isAuthed } from '@/lib/auth'
import { cols } from '@/lib/db'
import { parseRange, RANGES } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

const FIELDS = ['ts', 'slug', 'target', 'bot', 'visitor', 'country', 'region', 'city', 'refHost', 'referrer', 'utmSource', 'utmMedium', 'utmCampaign', 'device', 'browser', 'os', 'lang'] as const
const cell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : String(v ?? '')
  // Quote everything and neutralize spreadsheet formulas
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`
}

/** CSV of raw clicks for the selected range and link. */
export async function GET(req: Request) {
  if (!(await isAuthed())) return new Response('Unauthorized', { status: 401 })
  const p = new URL(req.url).searchParams
  const range = parseRange(p.get('range') ?? undefined)
  const link = p.get('link')
  const filter: Record<string, unknown> = {}
  if (link !== null) filter.slug = link === '/' ? '' : link
  if (range !== 'all') filter.ts = { $gte: new Date(Date.now() - RANGES[range].ms) }

  const { clicks } = await cols()
  const cursor = clicks.find(filter, { projection: { _id: 0 } }).sort({ ts: -1 }).limit(200_000)
  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(ctrl) {
      ctrl.enqueue(enc.encode(FIELDS.join(',') + '\n'))
      for await (const c of cursor) ctrl.enqueue(enc.encode(FIELDS.map((f) => cell(c[f])).join(',') + '\n'))
      ctrl.close()
    },
  })
  const name = `mueed-clicks-${link === null ? 'all' : link === '/' ? 'root' : link}-${range}.csv`
  return new Response(stream, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' } })
}
