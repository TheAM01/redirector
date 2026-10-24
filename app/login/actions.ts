'use server'

import { redirect } from 'next/navigation'
import { checkCredentials, clearSession, loginBlocked, recordAttempt, setSession } from '@/lib/auth'

export type LoginState = { error: string; username: string } | null

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get('username') ?? '')
  try {
    if (await loginBlocked()) return { error: 'Too many failed attempts. Try again in 15 minutes.', username }
  } catch {
    return { error: 'Database is not reachable. Check MONGODB_URI.', username }
  }
  const ok = checkCredentials(username, String(form.get('password') ?? ''))
  await recordAttempt(ok)
  if (!ok) return { error: 'Wrong username or password.', username }
  await setSession()
  redirect('/dashboard')
}

export async function logout() {
  await clearSession()
  redirect('/login')
}
