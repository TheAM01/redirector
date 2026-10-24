'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { cols } from '@/lib/db'
import { clearLinkCache, normalizeSlug, validateLink } from '@/lib/links'

export type Values = { slug: string; target: string; title: string; note: string; permanent: boolean; listed: boolean; enabled: boolean }
export type FormState = { error?: string; ok?: string; values?: Values } | null

const isDup = (e: unknown) => typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000

function read(form: FormData) {
  return {
    slug: normalizeSlug(String(form.get('slug') ?? '')),
    target: String(form.get('target') ?? '').trim(),
    title: String(form.get('title') ?? '').trim().slice(0, 80),
    note: String(form.get('note') ?? '').trim().slice(0, 500),
    permanent: form.get('permanent') === 'on',
    listed: form.get('listed') === 'on',
    enabled: form.get('enabled') === 'on',
  }
}

export async function createLink(_: FormState, form: FormData): Promise<FormState> {
  await requireAuth()
  const v = read(form)
  if (!v.slug) return { error: 'Give the link a name, like "github".', values: v }
  const err = validateLink(v.slug, v.target)
  if (err) return { error: err, values: v }
  const { links } = await cols()
  const now = new Date()
  try {
    await links.insertOne({ ...v, enabled: true, createdAt: now, updatedAt: now })
  } catch (e) {
    if (isDup(e)) return { error: `mueed.xyz/${v.slug} already exists.`, values: v }
    throw e
  }
  clearLinkCache()
  revalidatePath('/dashboard', 'layout')
  return { ok: `Created mueed.xyz/${v.slug}` }
}

export async function updateLink(original: string, _: FormState, form: FormData): Promise<FormState> {
  await requireAuth()
  const v = read(form)
  // The root link (mueed.xyz itself) keeps its empty slug
  if (original === '') v.slug = ''
  else if (!v.slug) return { error: 'The short link name cannot be empty.', values: v }
  const err = validateLink(v.slug, v.target)
  if (err) return { error: err, values: v }
  const { links, clicks } = await cols()
  try {
    const res = await links.updateOne({ slug: original }, { $set: { ...v, updatedAt: new Date() } })
    if (res.matchedCount === 0) return { error: 'This link no longer exists.', values: v }
  } catch (e) {
    if (isDup(e)) return { error: `mueed.xyz/${v.slug} already exists.`, values: v }
    throw e
  }
  // Keep analytics attached to the link when it's renamed
  if (v.slug !== original) await clicks.updateMany({ slug: original }, { $set: { slug: v.slug } })
  clearLinkCache()
  revalidatePath('/dashboard', 'layout')
  if (v.slug !== original) redirect(`/dashboard/links/${encodeURIComponent(v.slug)}?saved=1`)
  return { ok: 'Saved. It’s live now (other servers catch up within 15 seconds).' }
}

export async function deleteLink(slug: string, form: FormData) {
  await requireAuth()
  if (slug === '' || form.get('confirm') !== 'on') return
  const { links, clicks } = await cols()
  await links.deleteOne({ slug })
  if (form.get('purge') === 'on') await clicks.deleteMany({ slug })
  clearLinkCache()
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard/links')
}
