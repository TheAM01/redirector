'use client'

import { useActionState } from 'react'
import { LogIn } from 'lucide-react'
import { login } from './actions'
import { Field, inputCls, SubmitButton } from '@/components/form'

export function LoginForm() {
  const [state, action] = useActionState(login, null)
  const error = state?.error
  return (
    <form action={action} className="space-y-4">
      <Field label="Username">
        <input name="username" autoComplete="username" required autoFocus defaultValue={state?.username} className={inputCls} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" autoComplete="current-password" required autoFocus={!!state} className={inputCls} />
      </Field>
      {error && (
        <p role="alert" className="border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold text-red-900">
          {error}
        </p>
      )}
      <SubmitButton className="w-full justify-center">
        Sign in <LogIn className="w-4 h-4" />
      </SubmitButton>
    </form>
  )
}
