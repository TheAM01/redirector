'use client'

import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'
import { display } from './ui'

export const inputCls =
  'w-full border-2 border-black bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:shadow-[3px_3px_0_0_#fcb345] transition-shadow'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[11px] font-black uppercase tracking-widest text-black/55" style={display}>
        {label}
      </span>
      {children}
      {hint && <span className="block mt-1 text-xs text-black/45">{hint}</span>}
    </label>
  )
}

export function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="mt-0.5 w-5 h-5 flex-shrink-0 border-2 border-black bg-white peer-checked:bg-[#fcb345] peer-focus-visible:outline-3 peer-focus-visible:outline-black flex items-center justify-center after:content-[''] peer-checked:after:content-['✓'] after:text-xs after:font-black" />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="block text-xs text-black/50">{hint}</span>}
      </span>
    </label>
  )
}

export function SubmitButton({ children, className = '', variant = 'solid' }: { children: ReactNode; className?: string; variant?: 'solid' | 'accent' | 'danger' }) {
  const { pending } = useFormStatus()
  const look = variant === 'danger' ? 'bg-red-600 text-white hover:bg-black' : variant === 'accent' ? 'bg-[#fcb345] text-black hover:bg-black hover:text-white' : 'bg-black text-white hover:bg-white hover:text-black'
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 border-2 border-black px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[3px] hover:translate-y-[3px] active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${look} ${className}`}
      style={display}
    >
      {pending ? 'Working…' : children}
    </button>
  )
}
