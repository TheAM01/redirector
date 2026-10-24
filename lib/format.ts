export const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: n < 10000 ? 1 : 0 }).format(n)
export const num = (n: number) => new Intl.NumberFormat('en').format(Math.round(n))

const regions = new Intl.DisplayNames(['en'], { type: 'region' })
export function countryName(code: string) {
  if (!code || code === 'Unknown' || code.length !== 2) return 'Unknown'
  try {
    return regions.of(code) ?? code
  } catch {
    return code
  }
}
export const flag = (code: string) =>
  code && code.length === 2 && code !== 'Unknown' ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🏳️'

const langs = new Intl.DisplayNames(['en'], { type: 'language' })
export function languageName(tag: string) {
  if (!tag || tag === 'Unknown') return 'Unknown'
  try {
    return `${langs.of(tag)} (${tag})`
  } catch {
    return tag
  }
}

export function timeAgo(d: Date) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export const dateTime = (d: Date, zone: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: zone, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(d))
