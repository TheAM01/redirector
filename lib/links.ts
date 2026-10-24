import { cols } from './db'
import type { Link } from './types'

export const RESERVED = new Set(['dashboard', 'login', 'logout', 'api', '_next', 'robots.txt', 'llms.txt', 'icon.png', 'favicon.ico', 'sitemap.xml', 'manifest.webmanifest', 'not-found'])
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-_.]{0,62}[a-z0-9])?$/

export const shortUrl = (slug: string) => `https://mueed.xyz/${slug}`

// Links that existed in the old Express version; inserted the first time the database is empty.
export const SEED: Omit<Link, 'createdAt' | 'updatedAt' | 'enabled' | 'note'>[] = [
  { slug: '', title: 'Home', target: 'https://me.mueed.xyz', permanent: true, listed: true },
  { slug: 'portfolio', title: 'Portfolio', target: 'https://portfolio.mueed.xyz', permanent: false, listed: true },
  { slug: 'github', title: 'GitHub', target: 'https://github.com/TheAM01', permanent: false, listed: true },
  { slug: 'linkedin', title: 'LinkedIn', target: 'https://www.linkedin.com/in/mueeeeed', permanent: false, listed: true },
  { slug: 'instagram', title: 'Instagram', target: 'https://instagram.com/abdulmueed.wav', permanent: false, listed: true },
  { slug: 'spotify', title: 'Spotify', target: 'https://open.spotify.com/artist/2CTBnkHNgYSjaXtnHiIXAA?si=iC81rf7GSU6xbZQ31212qA', permanent: false, listed: true },
  { slug: 'discord', title: 'Discord server', target: 'https://discord.gg/VJ8jHWTj4K', permanent: false, listed: true },
  { slug: 'solid-pixel', title: 'SolidPixel', target: 'http://194.164.125.5:6024/', permanent: false, listed: false },
  { slug: 'pfh', title: 'Parhle Fail Hojayega (old)', target: 'https://parhle.glitch.me', permanent: false, listed: false },
  { slug: 'unreleased', title: 'Unreleased music', target: 'https://drive.google.com/drive/u/4/folders/16BfK1RS1Ybqcy22eweRqe8VSIoE5Wso0', permanent: false, listed: false },
  { slug: 'wkp', title: 'Wahaj portfolio', target: 'https://wahaj-portfolio-four.vercel.app', permanent: false, listed: false },
]

const g = globalThis as unknown as { _seeded?: Promise<void> }

export function ensureSeeded() {
  g._seeded ??= (async () => {
    const { links } = await cols()
    if ((await links.estimatedDocumentCount()) > 0) return
    const now = new Date()
    await links.insertMany(SEED.map((l) => ({ ...l, enabled: true, note: '', createdAt: now, updatedAt: now })), { ordered: false }).catch(() => {})
  })().catch((e) => {
    g._seeded = undefined
    throw e
  })
  return g._seeded
}

// In-memory cache so redirects don't wait on the database. It lives on globalThis so the redirect handler
// and the dashboard share it within a server; other servers pick up edits within CACHE_MS.
const CACHE_MS = 15_000
const MISS_MS = 10_000
const gc = globalThis as unknown as { _linkCache?: Map<string, { link: Link | null; exp: number }> }
const cache = (gc._linkCache ??= new Map())

export async function resolve(slug: string): Promise<Link | null> {
  const hit = cache.get(slug)
  if (hit && hit.exp > Date.now()) return hit.link
  await ensureSeeded()
  const { links } = await cols()
  const link = await links.findOne({ slug, enabled: true })
  cache.set(slug, { link, exp: Date.now() + (link ? CACHE_MS : MISS_MS) })
  if (cache.size > 5000) cache.clear()
  return link
}

export const clearLinkCache = () => cache.clear()

export function normalizeSlug(input: string) {
  return input.trim().replace(/^\/+|\/+$/g, '').toLowerCase()
}

export function validateLink(slug: string, target: string): string | null {
  if (slug !== '' && !SLUG_RE.test(slug)) return 'Short link can use letters, numbers, dashes, dots and underscores (max 64 characters).'
  if (RESERVED.has(slug)) return `"${slug}" is reserved by the site.`
  let url: URL
  try {
    url = new URL(target)
  } catch {
    return 'Destination must be a full URL, like https://example.com'
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'Destination must start with http:// or https://'
  if (url.hostname === 'mueed.xyz' && normalizeSlug(url.pathname) === slug) return 'A link cannot redirect to itself.'
  return null
}
