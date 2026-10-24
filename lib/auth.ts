import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cols } from './db'
import { secret } from './secret'

export const COOKIE = 'rd_session'
const MAX_AGE = 60 * 60 * 24 * 7

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

function safeEqual(a: string, b: string) {
  // Hash first so lengths always match and timing doesn't leak the length
  const x = createHash('sha256').update(a).digest()
  const y = createHash('sha256').update(b).digest()
  return timingSafeEqual(x, y)
}

export function checkCredentials(user: string, pass: string) {
  const U = process.env.DASHBOARD_USERNAME
  const P = process.env.DASHBOARD_PASSWORD
  if (!U || !P) return false
  // Evaluate both so a wrong username takes as long as a wrong password
  const okUser = safeEqual(user, U)
  const okPass = safeEqual(pass, P)
  return okUser && okPass
}

export function createToken() {
  const payload = Buffer.from(JSON.stringify({ u: process.env.DASHBOARD_USERNAME, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifyToken(token: string | undefined) {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return u === process.env.DASHBOARD_USERNAME && typeof exp === 'number' && exp > Date.now()
  } catch {
    return false
  }
}

export async function setSession() {
  ;(await cookies()).set(COOKIE, createToken(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE })
}

export async function clearSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function isAuthed() {
  return verifyToken((await cookies()).get(COOKIE)?.value)
}

/** Call at the top of every dashboard page, server action and API route. */
export async function requireAuth() {
  if (!(await isAuthed())) redirect('/login')
}

// Login throttling, stored in MongoDB so it works across serverless instances (entries expire after 15 min).
const MAX_FAILS = 8

async function ipHash() {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local'
  return createHash('sha256').update(`login|${ip}|${secret()}`).digest('base64url').slice(0, 22)
}

export async function loginBlocked() {
  const { attempts } = await cols()
  const fails = await attempts.countDocuments({ ipHash: await ipHash(), ok: false, at: { $gt: new Date(Date.now() - 15 * 60 * 1000) } })
  return fails >= MAX_FAILS
}

export async function recordAttempt(ok: boolean) {
  const { attempts } = await cols()
  const h = await ipHash()
  if (ok) await attempts.deleteMany({ ipHash: h })
  else await attempts.insertOne({ ipHash: h, at: new Date(), ok })
}
