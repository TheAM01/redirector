import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAuthed } from '@/lib/auth'
import { display } from '@/components/ui'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }

export default async function LoginPage() {
  if (await isAuthed()) redirect('/dashboard')
  return (
    <main className="min-h-screen flex items-center justify-center px-3 py-12">
      <div className="w-full max-w-sm">
        <div className="relative inline-block group mb-8">
          <div className="absolute -inset-2 bg-black skew-x-9 group-hover:skew-x-4 transition-transform duration-300" />
          <h1 className="relative z-10 text-4xl sm:text-5xl font-black tracking-tighter leading-none text-white px-4 py-2" style={display}>
            LINKS
          </h1>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-[#fcb345] translate-x-2 translate-y-2 border-[3px] border-black" aria-hidden />
          <div className="relative border-[3px] border-black bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-black/40 mb-5" style={display}>
              Dashboard sign in
            </p>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}
