import { createHash } from 'node:crypto'
import { isbot } from 'isbot'
import UAParser from 'ua-parser-js'
import type { Click, Link } from './types'
import { secret } from './secret'

const clean = (v: string | null | undefined, max = 120) => (v ?? '').trim().slice(0, max)

function decode(v: string | null) {
  if (!v) return ''
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}

function refHost(ref: string) {
  if (!ref) return ''
  try {
    return new URL(ref).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Builds the analytics record for one redirect. Geo comes from headers Vercel adds to every request. */
export function buildClick(req: Request, link: Link): Click {
  const h = req.headers
  const url = new URL(req.url)
  const ua = h.get('user-agent') ?? ''
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || ''
  const p = new UAParser(ua).getResult()
  const referrer = clean(h.get('referer'), 500)
  const deviceType = p.device.type
  const device = deviceType === 'mobile' || deviceType === 'tablet' ? deviceType : deviceType ? 'other' : 'desktop'
  return {
    slug: link.slug,
    target: link.target,
    ts: new Date(),
    visitor: createHash('sha256').update(`${ip}|${ua}|${secret()}`).digest('base64url').slice(0, 22),
    bot: !ua || isbot(ua),
    country: clean(h.get('x-vercel-ip-country'), 2).toUpperCase(),
    region: clean(h.get('x-vercel-ip-country-region'), 10),
    city: clean(decode(h.get('x-vercel-ip-city'))),
    referrer,
    refHost: refHost(referrer),
    utmSource: clean(url.searchParams.get('utm_source') ?? url.searchParams.get('ref')),
    utmMedium: clean(url.searchParams.get('utm_medium')),
    utmCampaign: clean(url.searchParams.get('utm_campaign')),
    browser: clean(p.browser.name) || 'Unknown',
    os: clean(p.os.name) || 'Unknown',
    device,
    lang: clean((h.get('accept-language') ?? '').split(',')[0].split(';')[0], 12),
  }
}

/** Destination URL with the visitor's query string carried over (without overriding the target's own params). */
export function destination(req: Request, link: Link) {
  const out = new URL(link.target)
  new URL(req.url).searchParams.forEach((v, k) => {
    if (!out.searchParams.has(k)) out.searchParams.append(k, v)
  })
  return out.toString()
}
