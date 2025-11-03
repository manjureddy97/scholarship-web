'use client'

import { useAuth } from '@/features/auth/auth.context'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import type { Role } from '@/features/auth/types'
import { usePersistentState } from '@/lib/hooks/usePersistentState'

// optional: if static export still tries to prerender this page, keep this:
export const dynamic = 'force-dynamic'

const ROLES: { value: Role; label: string }[] = [
  { value: 'applicant', label: 'Applicant' },
  { value: 'clientAdmin', label: 'Client Admin' },
  { value: 'coordinator', label: 'Program Coordinator' },
  { value: 'evaluator', label: 'Candidate Evaluator' },
  { value: 'support', label: 'Support Rep' },
  { value: 'systemAdmin', label: 'System Admin' },
]

// keep this in sync with AuthProvider ROLE_HOME
const ROLE_HOME: Record<Role, string> = {
  applicant: '/dashboard',
  clientAdmin: '/admin/reports',
  coordinator: '/applications/new',
  evaluator: '/evaluation',
  support: '/support',
  systemAdmin: '/sysadmin',
}

// demo emails to auto-fill when switching persona
const DEMO_EMAILS: Record<Role, string> = {
  applicant: 'applicant@demo.com',
  clientAdmin: 'admin@demo.com',
  coordinator: 'coordinator@demo.com',
  evaluator: 'evaluator@demo.com',
  support: 'support@demo.com',
  systemAdmin: 'sysadmin@demo.com',
}

type Dict = Record<string, any>

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [role, setRole] = useState<Role>('applicant')
  const [email, setEmail] = usePersistentState('login-email', '')
  const [password, setPassword] = usePersistentState('login-pwd', '')
  const [showPw, setShowPw] = useState(false)

  // i18n: load from localStorage in effect (avoid SSR access)
  const [lang, setLang] = useState<'en' | 'fr' | 'es'>('en')
  const [dict, setDict] = useState<Dict>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedLang = (window.localStorage.getItem('lang') as 'en' | 'fr' | 'es' | null) || 'en'
      setLang(storedLang)
    } catch { }
    try {
      const raw = window.localStorage.getItem('__i18n')
      setDict(raw ? JSON.parse(raw) : {})
    } catch {
      setDict({})
    }
  }, [])

  const t = (k: string) => {
    const parts = k.split('.')
    let cur: any = dict?.[lang]
    for (const p of parts) cur = cur?.[p]
    return cur ?? k
  }

  // when persona changes, auto-fill the demo email
  useEffect(() => {
    setEmail(DEMO_EMAILS[role])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      {/* soft blobs for flair */}
      <div className="pointer-events-none absolute -left-20 top-[-10%] h-64 w-64 rounded-full bg-pink-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="mx-auto grid min-h-[100dvh] w-full max-w-6xl grid-cols-1 md:grid-cols-2">
        {/* Left: image/brand panel */}
        <aside className="relative hidden overflow-hidden rounded-none md:block md:rounded-r-3xl">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1600&auto=format&fit=crop"
              alt="Students studying"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/70 via-indigo-700/50 to-fuchsia-600/70" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-indigo-50">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
                <span>Scholarship Portal</span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Empowering students with<br />transparent selection & support
              </h2>
            </div>
            <ul className="space-y-2 text-sm/relaxed text-indigo-100">
              <li>• Multi-role workflows (Applicant, Evaluator, Admin)</li>
              <li>• Weighted scoring & exports</li>
              <li>• Support inbox & system controls</li>
            </ul>
          </div>
        </aside>

        {/* Right: form card */}
        <main className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700">
                <span>Welcome back</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-gray-900">{t('auth.login')}</h1>
              <p className="text-sm text-gray-600">
                Sign in with any demo persona — password is <b>Test@1234</b>.
              </p>
            </div>

            <form
              className="grid gap-4 rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur"
              onSubmit={async (e) => {
                e.preventDefault()
                const ok = await signIn(email, password || undefined)
                if (!ok) { alert('Invalid credentials or not verified.'); return }
                // safe: event handler runs only in browser
                const session = JSON.parse(window.localStorage.getItem('user') || 'null') as { role?: Role } | null
                const next = ROLE_HOME[(session?.role as Role) ?? role] || '/dashboard'
                router.replace(next)
              }}
            >
              {/* Personas as colorful chips */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">{t('auth.persona')}</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const active = role === r.value
                    const pill = active
                      ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`rounded-full px-3 py-1 text-xs transition ${pill}`}
                      >
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-700">{t('auth.email')}</span>
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  type="email"
                  placeholder="you@demo.com"
                />
                <div className="text-[11px] text-gray-500">
                  Persona autofills a demo email. You can also type your own.
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-700">{t('auth.password')}</span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 text-xs text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-[11px] text-gray-500">
                  Demo users use password <b>Test@1234</b>.
                </span>
              </label>

              {/* Hidden select for accessibility (keeps same data binding) */}
              <select
                aria-hidden
                tabIndex={-1}
                className="hidden"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>

              <button className="mt-1 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-fuchsia-300">
                {t('auth.continue')}
              </button>

              <div className="text-center text-sm text-gray-600">
                {t('auth.need_account')}{' '}
                <a className="font-medium text-indigo-600 hover:underline" href="/signup">{t('auth.signup')}</a>
              </div>
            </form>

            {/* little footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} Scholarship Portal • Demo environment
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
