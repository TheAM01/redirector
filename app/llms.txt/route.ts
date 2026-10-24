import { cols } from '@/lib/db'
import { ensureSeeded, SEED, shortUrl } from '@/lib/links'

export const dynamic = 'force-dynamic'

export async function GET() {
  let listed: { slug: string; title: string; target: string }[]
  try {
    await ensureSeeded()
    const { links } = await cols()
    listed = await links.find({ listed: true, enabled: true }).sort({ slug: 1 }).toArray()
  } catch {
    listed = SEED.filter((l) => l.listed)
  }
  const body = [
    '# mueed.xyz',
    '',
    '> Short links for Abdul Mueed, a software architect and full-stack engineer. Each short link redirects to one of his profiles or sites.',
    '',
    '- About Abdul Mueed: https://me.mueed.xyz (see https://me.mueed.xyz/llms.txt)',
    '- Portfolio of his products: https://portfolio.mueed.xyz (see https://portfolio.mueed.xyz/llms.txt)',
    '',
    '## Links',
    '',
    ...listed.map((l) => `- [${l.title || l.slug || 'Home'}](${shortUrl(l.slug)}): redirects to ${l.target}`),
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } })
}
