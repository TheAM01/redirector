'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {}
      }}
      className="inline-flex items-center gap-1 border-2 border-black bg-white px-2 py-1 text-[11px] font-black uppercase tracking-wider hover:bg-[#fcb345] transition-colors"
      aria-label={`${label} ${text}`}
    >
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {done ? 'Copied' : label}
    </button>
  )
}
