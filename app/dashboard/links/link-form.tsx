'use client'

import { useActionState } from 'react'
import { Check as CheckIcon, Plus, Save } from 'lucide-react'
import { Check, Field, inputCls, SubmitButton } from '@/components/form'
import type { FormState } from './actions'

type Initial = { slug: string; target: string; title: string; note: string; permanent: boolean; listed: boolean; enabled: boolean }

export function LinkForm({ action, initial, mode }: { action: (s: FormState, f: FormData) => Promise<FormState>; initial?: Initial; mode: 'create' | 'edit' }) {
  const [state, formAction] = useActionState(action, null)
  const isRoot = mode === 'edit' && initial?.slug === ''
  // After an error React resets the form, so refill it with what was submitted
  const v = state?.error && state.values ? { ...state.values, slug: isRoot ? '' : state.values.slug } : initial
  return (
    <form action={formAction} className="grid gap-4" key={mode === 'create' && state?.ok ? state.ok : undefined}>
      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4">
        <Field label="Short link" hint={isRoot ? 'This is mueed.xyz itself and cannot be renamed.' : 'Letters, numbers, dashes. Case doesn’t matter.'}>
          <div className="flex">
            <span className="flex items-center border-2 border-r-0 border-black bg-black/[0.04] px-2.5 text-sm font-bold text-black/55">mueed.xyz/</span>
            <input name="slug" defaultValue={v?.slug} disabled={isRoot} required={!isRoot} placeholder="github" pattern="[A-Za-z0-9][A-Za-z0-9\-_.]*" className={inputCls} />
          </div>
        </Field>
        <Field label="Destination">
          <input name="target" type="url" defaultValue={v?.target} required placeholder="https://github.com/you" className={inputCls} />
        </Field>
      </div>
      <Field label="Title" hint="Shown in the dashboard and on public link lists.">
        <input name="title" defaultValue={v?.title} maxLength={80} placeholder="GitHub" className={inputCls} />
      </Field>
      {mode === 'edit' && (
        <Field label="Private note">
          <textarea name="note" defaultValue={v?.note} rows={2} maxLength={500} className={inputCls} />
        </Field>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        {mode === 'edit' ? <Check name="enabled" label="Enabled" hint="Off = visitors get the 404 page" defaultChecked={v?.enabled} /> : <input type="hidden" name="enabled" value="on" />}
        <Check name="listed" label="Public" hint="Listed in llms.txt and the links page" defaultChecked={v?.listed ?? true} />
        <Check name="permanent" label="Permanent (301)" hint="Browsers cache it: repeat clicks aren’t counted and edits apply slowly" defaultChecked={v?.permanent ?? false} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant={mode === 'create' ? 'accent' : 'solid'}>
          {mode === 'create' ? (
            <>
              <Plus className="w-4 h-4" /> Create link
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save changes
            </>
          )}
        </SubmitButton>
        {state?.error && (
          <p role="alert" className="border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold text-red-900">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="inline-flex items-center gap-1.5 border-2 border-black bg-green-100 px-3 py-2 text-sm font-bold text-green-900">
            <CheckIcon className="w-4 h-4" /> {state.ok}
          </p>
        )}
      </div>
    </form>
  )
}
