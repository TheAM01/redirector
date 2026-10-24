import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { ArrowLeft, BarChart3, Download, Trash2 } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { cols } from '@/lib/db'
import { linkCounts } from '@/lib/analytics'
import { shortUrl } from '@/lib/links'
import { dateTime, num, timeAgo } from '@/lib/format'
import { tz } from '@/lib/analytics'
import { Check, SubmitButton } from '@/components/form'
import { CopyButton } from '@/components/copy-button'
import { display } from '@/components/ui'
import { LinkForm } from '../link-form'
import { deleteLink, updateLink } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> }

export default async function EditLink({ params, searchParams }: Props) {
  await requireAuth()
  const raw = decodeURIComponent((await params).slug)
  const slug = raw === '~root' ? '' : raw
  const { links } = await cols()
  const link = await links.findOne({ slug })
  if (!link) notFound()
  const saved = (await searchParams).saved

  const url = shortUrl(slug)
  const [svg, counts] = await Promise.all([QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#000000', light: '#ffffff' } }), linkCounts()])
  const c = counts.get(slug)
  const qrHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  return (
    <div>
      <Link href="/dashboard/links" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-black/50 hover:text-black mb-4" style={display}>
        <ArrowLeft className="w-3.5 h-3.5" /> All links
      </Link>
      <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight break-all" style={display}>
          mueed.xyz/{slug}
        </h1>
        <CopyButton text={url} />
      </div>
      {saved && <p className="mb-6 inline-block border-2 border-black bg-green-100 px-3 py-2 text-sm font-bold text-green-900">Saved and renamed.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="grid gap-6">
          <section className="border-2 border-black bg-white p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-black mb-4" style={display}>
              Edit
            </h2>
            <LinkForm
              action={updateLink.bind(null, slug)}
              mode="edit"
              initial={{ slug, target: link.target, title: link.title, note: link.note, permanent: link.permanent, listed: link.listed, enabled: link.enabled }}
            />
          </section>

          {slug !== '' && (
            <section className="border-2 border-red-700 bg-white p-4 sm:p-6">
              <h2 className="text-base font-black mb-1 text-red-800" style={display}>
                Delete link
              </h2>
              <p className="text-sm text-black/60 mb-4">Visitors will get the 404 page. To pause it instead, untick “Enabled” above.</p>
              <form action={deleteLink.bind(null, slug)} className="grid gap-3">
                <Check name="confirm" label={`Yes, delete mueed.xyz/${slug}`} />
                <Check name="purge" label="Also delete its click history" />
                <div>
                  <SubmitButton variant="danger">
                    <Trash2 className="w-4 h-4" /> Delete
                  </SubmitButton>
                </div>
              </form>
            </section>
          )}
        </div>

        <aside className="grid gap-6">
          <section className="border-2 border-black bg-white p-4 sm:p-5">
            <h2 className="text-sm font-black mb-3" style={display}>
              Stats
            </h2>
            <dl className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <dt className="text-[11px] font-black uppercase tracking-widest text-black/45">7 days</dt>
                <dd className="text-2xl font-black" style={display}>{num(c?.week ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-widest text-black/45">All time</dt>
                <dd className="text-2xl font-black" style={display}>{num(c?.all ?? 0)}</dd>
              </div>
            </dl>
            <p className="text-xs text-black/55 mb-1">Last click: {c?.last ? `${timeAgo(c.last)} (${dateTime(c.last, tz())})` : 'never'}</p>
            <p className="text-xs text-black/55 mb-4">Created {dateTime(link.createdAt, tz())}</p>
            <Link
              href={`/dashboard?link=${encodeURIComponent(slug || '/')}`}
              className="inline-flex items-center gap-1.5 border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white"
              style={display}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Full analytics
            </Link>
          </section>
          <section className="border-2 border-black bg-white p-4 sm:p-5">
            <h2 className="text-sm font-black mb-3" style={display}>
              QR code
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrHref} alt={`QR code for ${url}`} width={240} height={240} className="w-full h-auto border-2 border-black" />
            <a
              href={qrHref}
              download={`mueed-${slug || 'home'}-qr.svg`}
              className="mt-3 inline-flex items-center gap-1.5 border-2 border-black bg-[#fcb345] px-3 py-2 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white"
              style={display}
            >
              <Download className="w-3.5 h-3.5" /> Download SVG
            </a>
          </section>
        </aside>
      </div>
    </div>
  )
}
