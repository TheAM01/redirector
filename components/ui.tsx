import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

export const display = { fontFamily: 'var(--font-space-grotesk)' }

// Same 3D tilt the "me" site applies on hover, done in CSS so cards can stay server components.
export const tilt =
  'transition-all duration-150 hover:-translate-x-1.5 hover:-translate-y-1.5 hover:scale-95 active:scale-85 hover:[transform:perspective(1000px)_rotateX(2deg)_rotateZ(-1deg)]'

/** Frosted panel used for every section, as on "me". */
export function Panel({ id, title, kicker, children, className = '' }: { id?: string; title?: ReactNode; kicker?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-24 mb-12 sm:mb-20 p-6 sm:p-8 lg:p-10 rounded-none bg-neutral-100/20 backdrop-blur-[2px] shadow-sm shadow-gray-800/10 ${className}`}>
      {kicker && <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-black/40 mb-2" style={display}>{kicker}</p>}
      {title && <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-6 sm:mb-8" style={display}>{title}</h2>}
      {children}
    </section>
  )
}

type BtnProps = { href: string; children: ReactNode; variant?: 'solid' | 'outline' | 'accent'; external?: boolean } & Omit<ComponentProps<'a'>, 'href'>

/** Hard-edged button with an offset shadow block. */
export function Button({ href, children, variant = 'solid', external, className = '', ...rest }: BtnProps) {
  const isExternal = external ?? /^(https?:|mailto:)/.test(href)
  const look =
    variant === 'solid'
      ? 'bg-black text-white hover:bg-white hover:text-black'
      : variant === 'accent'
        ? 'bg-[#fcb345] text-black hover:bg-black hover:text-white'
        : 'bg-white text-black hover:bg-black hover:text-white'
  const cls = `group/btn relative inline-flex items-center gap-2 border-2 border-black px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[3px] hover:translate-y-[3px] active:scale-95 transition-all duration-150 ${look} ${className}`
  const content = (
    <>
      {children}
      {isExternal && <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" aria-hidden />}
    </>
  )
  if (isExternal) {
    return (
      <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className={cls} style={display} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={cls} style={display} {...(rest as object)}>
      {content}
    </Link>
  )
}

export function Tag({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span className={`inline-block px-2.5 sm:px-3 py-1 border-2 border-black text-[11px] sm:text-xs font-bold text-black rounded-none ${accent ? 'bg-[#fcb345]' : 'bg-white'}`}>
      {children}
    </span>
  )
}
