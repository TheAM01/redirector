import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import { normalizeSlug, resolve, SEED } from '@/lib/links'
import { buildClick, destination } from '@/lib/track'
import { cols } from '@/lib/db'
import type { Link } from '@/lib/types'

// Every short link (mueed.xyz/<slug>) is handled here, before any page renders.
// Unknown slugs fall through to the app, which shows the 404 page.
export async function proxy(req: NextRequest, event: NextFetchEvent) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return NextResponse.next()
  const path = req.nextUrl.pathname
  if (path.slice(1).includes('/')) return NextResponse.next()
  const slug = normalizeSlug(path)

  let link: Link | null
  try {
    link = await resolve(slug)
  } catch (e) {
    // Database unreachable: keep the original links working from the built-in list.
    console.error('[redirector] lookup failed', e)
    const s = SEED.find((l) => l.slug === slug)
    link = s ? { ...s, enabled: true, note: '', createdAt: new Date(0), updatedAt: new Date(0) } : null
  }
  if (!link) return NextResponse.next()

  const res = NextResponse.redirect(destination(req, link), link.permanent ? 301 : 302)
  // Temporary links must reach the server every time so edits apply and clicks are counted.
  res.headers.set('Cache-Control', link.permanent ? 'public, max-age=86400' : 'private, no-store, max-age=0')

  if (req.method === 'GET') {
    const click = buildClick(req, link)
    event.waitUntil(
      cols()
        .then(({ clicks }) => clicks.insertOne(click))
        .catch((e) => console.error('[redirector] failed to record click', e)),
    )
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/|dashboard|login|api/|robots\\.txt|llms\\.txt|icon\\.png|favicon\\.ico|manifest\\.webmanifest).*)'],
}
