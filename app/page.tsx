import { ArrowUpRight } from 'lucide-react'
import { cols } from '@/lib/db'
import { ensureSeeded, shortUrl } from '@/lib/links'
import { display, tilt } from '@/components/ui'

export const dynamic = 'force-dynamic'

// Only shown when the root redirect (mueed.xyz → me.mueed.xyz) is disabled in the dashboard.
export default async function Home() {
  let listed: { slug: string; title: string; target: string }[] = []
  try {
    await ensureSeeded()
    const { links } = await cols()
    listed = await links.find({ listed: true, enabled: true, slug: { $ne: '' } }, { projection: { slug: 1, title: 1, target: 1 } }).sort({ slug: 1 }).toArray()
  } catch {}
  return (
    <main className="max-w-3xl mx-auto px-3 sm:px-6 py-12 sm:py-20">
      <div className="relative inline-block group mb-4">
        <div className="absolute -inset-2 bg-black skew-x-9 group-hover:skew-x-4 transition-transform duration-300" />
        <h1 className="relative z-10 text-5xl sm:text-7xl font-black tracking-tighter leading-none text-white px-4 sm:px-6 py-2" style={display}>
          <span className="sr-only">Abdul </span>MUEED
        </h1>
      </div>
      <p className="text-sm sm:text-lg font-black uppercase tracking-widest mb-10" style={display}>
        Links
      </p>
      <ul className="grid gap-3">
        {listed.map((l) => (
          <li key={l.slug}>
            <a href={`/${l.slug}`} className={`group flex items-center justify-between gap-4 border-2 border-black bg-white p-4 sm:p-5 hover:bg-black hover:text-white ${tilt}`}>
              <span>
                <span className="block text-base sm:text-lg font-black" style={display}>{l.title || l.slug}</span>
                <span className="block text-xs text-black/50 group-hover:text-white/60">{shortUrl(l.slug).replace('https://', '')}</span>
              </span>
              <ArrowUpRight className="w-5 h-5 flex-shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
