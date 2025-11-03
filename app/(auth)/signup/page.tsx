'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hashPassword } from '@/lib/crypto'
import type { Role } from '@/features/auth/types'

// optional: if static export keeps trying to pre-render this page, leave this:
export const dynamic = 'force-dynamic'

const DEFAULT_ROLE: Role = 'applicant'

type Dict = Record<string, any> // i18n dict shape is unknown in demo

export default function SignUp() {
    const r = useRouter()

    // form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    // i18n + lang (load from localStorage in effect to avoid SSR access)
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

    // translator helper
    const t = (k: string) => {
        const parts = k.split('.')
        let cur: any = dict?.[lang]
        for (const p of parts) cur = cur?.[p]
        return cur ?? k
    }

    // simple strength (demo)
    const strength = useMemo(() => {
        let s = 0
        if (password.length >= 6) s += 1
        if (/[A-Z]/.test(password)) s += 1
        if (/[0-9]/.test(password)) s += 1
        if (/[^A-Za-z0-9]/.test(password)) s += 1
        return s // 0..4
    }, [password])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const users = JSON.parse(window.localStorage.getItem('users') || '[]')
            if (users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())) {
                alert(t('auth.errors.email_in_use'))
                setLoading(false)
                return
            }

            const passwordHash = await hashPassword(password)
            const token = Math.random().toString(36).slice(2)
            const newUser = {
                id: crypto.randomUUID(),
                email,
                role: DEFAULT_ROLE,
                passwordHash,
                verified: false,
                token,
            }

            window.localStorage.setItem('users', JSON.stringify([...users, newUser]))

            // demo “email”
            const outbox = JSON.parse(window.localStorage.getItem('outbox') || '[]')
            outbox.push({
                to: email,
                subject: 'Confirm your account',
                body: `Click to verify: ${location.origin}/verify?token=${token}`,
            })
            window.localStorage.setItem('outbox', JSON.stringify(outbox))

            alert(t('auth.confirmation_sent'))
            r.push('/login')
        } catch (err) {
            console.error(err)
            alert('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-[100dvh] bg-gradient-to-br from-pink-50 via-white to-indigo-50">
            {/* soft blobs */}
            <div className="pointer-events-none absolute -left-20 top-[-10%] h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
            <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="mx-auto grid min-h-[100dvh] w-full max-w-6xl grid-cols-1 md:grid-cols-2">
                {/* Left hero */}
                <aside className="relative hidden overflow-hidden md:block md:rounded-r-3xl">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1600&auto=format&fit=crop"
                            alt="Campus courtyard"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-600/70 via-indigo-700/50 to-indigo-900/60" />
                    </div>
                    <div className="relative z-10 flex h-full flex-col justify-between p-10 text-fuchsia-50">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
                                <span>Join the community</span>
                            </div>
                            <h2 className="mt-4 text-3xl font-semibold leading-tight">
                                Create your account and<br />start your application
                            </h2>
                        </div>
                        <ul className="space-y-2 text-sm/relaxed text-indigo-100">
                            <li>• Save progress and return anytime</li>
                            <li>• Choose your language preference</li>
                            <li>• Verify email to access the portal</li>
                        </ul>
                    </div>
                </aside>

                {/* Right form */}
                <main className="flex items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-md">
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-100 px-3 py-1 text-xs text-fuchsia-700">
                                <span>{t('auth.create_account')}</span>
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold text-gray-900">{t('auth.create_account')}</h1>
                            <p className="text-sm text-gray-600">{t('auth.by_creating')}</p>
                        </div>

                        <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur">
                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-gray-700">{t('auth.email')}</span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                                    placeholder="you@example.com"
                                />
                            </label>

                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-gray-700">{t('auth.password')}</span>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 text-xs text-fuchsia-600 hover:bg-fuchsia-50"
                                        onClick={() => setShowPw(s => !s)}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPw ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <span className="text-[11px] text-gray-500">{t('auth.password_hint')}</span>

                                {/* strength meter */}
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className={`h-full bg-gradient-to-r ${strength >= 3
                                                ? 'from-green-500 to-emerald-500'
                                                : strength >= 2
                                                    ? 'from-amber-500 to-orange-500'
                                                    : 'from-rose-500 to-pink-500'
                                            }`}
                                        style={{ width: `${(strength / 4) * 100}%` }}
                                    />
                                </div>
                            </label>

                            {/* Language as colorful chips */}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">{t('auth.language')}</label>
                                <div className="flex gap-2">
                                    {(['en', 'fr', 'es'] as const).map(code => {
                                        const active = lang === code
                                        const pill = active
                                            ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        const label = code === 'en' ? 'English' : code === 'fr' ? 'Français' : 'Español'
                                        return (
                                            <button
                                                key={code}
                                                type="button"
                                                onClick={() => {
                                                    setLang(code)
                                                    try { window.localStorage.setItem('lang', code) } catch { }
                                                }}
                                                className={`rounded-full px-3 py-1 text-xs transition ${pill}`}
                                            >
                                                {label}
                                            </button>
                                        )
                                    })}
                                </div>
                                {/* hidden select to preserve form semantics if you need it later */}
                                <select
                                    aria-hidden tabIndex={-1}
                                    className="hidden" value={lang} onChange={(e) => setLang(e.target.value as any)}
                                >
                                    <option value="en">English</option>
                                    <option value="fr">Français</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>

                            <button
                                disabled={loading}
                                className="mt-1 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-fuchsia-300 disabled:opacity-60"
                            >
                                {loading ? t('common.loading') : t('auth.create')}
                            </button>

                            <p className="text-center text-sm text-gray-600">
                                {t('auth.need_account')}{' '}
                                <a className="font-medium text-indigo-600 hover:underline" href="/login">Log in</a>
                            </p>
                        </form>

                        <div className="mt-6 text-center text-xs text-gray-500">
                            By creating an account, we’ll send a verification link to your email.
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
