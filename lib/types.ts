import type { ObjectId } from 'mongodb'

export type Link = {
  _id?: ObjectId
  /** Lowercase path after mueed.xyz/. Empty string is the root (mueed.xyz itself). */
  slug: string
  target: string
  /** 301 when true (cached by browsers, best for links that never change), otherwise 302 */
  permanent: boolean
  /** Shown publicly in llms.txt and the fallback home page */
  listed: boolean
  enabled: boolean
  title: string
  note: string
  createdAt: Date
  updatedAt: Date
}

export type Click = {
  _id?: ObjectId
  slug: string
  target: string
  ts: Date
  /** Hash of IP + user agent + secret. Counts unique visitors without storing IPs. */
  visitor: string
  bot: boolean
  country: string
  region: string
  city: string
  referrer: string
  refHost: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  browser: string
  os: string
  device: string
  lang: string
}

export type LoginAttempt = { ipHash: string; at: Date; ok: boolean }
