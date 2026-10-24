import { createHash } from 'node:crypto'

/** Secret for signing cookies and hashing visitors. Falls back to one derived from the login, so the app still works if SESSION_SECRET is missing. */
export function secret() {
  const s = process.env.SESSION_SECRET
  if (s && s.length >= 16) return s
  return createHash('sha256').update(`redirector:${process.env.DASHBOARD_USERNAME}:${process.env.DASHBOARD_PASSWORD}`).digest('hex')
}
