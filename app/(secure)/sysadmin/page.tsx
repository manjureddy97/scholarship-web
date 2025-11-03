'use client'

import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/auth.context'
import type { Role } from '@/features/auth/types'

export const dynamic = 'force-dynamic' // optional: avoids static prerender for this page

type UserRow = { id: string; email: string; role: Role; verified: boolean }

const ROLE_LABEL: Record<Role, string> = {
    applicant: 'Applicant',
    clientAdmin: 'Client Admin',
    coordinator: 'Coordinator',
    evaluator: 'Evaluator',
    support: 'Support',
    systemAdmin: 'System Admin',
}

const ROLE_OPTIONS: { value: 'all' | Role; label: string }[] = [
    { value: 'all', label: 'All roles' },
    { value: 'applicant', label: ROLE_LABEL.applicant },
    { value: 'clientAdmin', label: ROLE_LABEL.clientAdmin },
    { value: 'coordinator', label: ROLE_LABEL.coordinator },
    { value: 'evaluator', label: ROLE_LABEL.evaluator },
    { value: 'support', label: ROLE_LABEL.support },
    { value: 'systemAdmin', label: ROLE_LABEL.systemAdmin },
]

export default function SysAdminPage() {
    const { user } = useAuth()
    const isSysAdmin = user?.role === 'systemAdmin'

    // density + UI
    const [compact, setCompact] = useState(true)

    // filters/sort
    const [q, setQ] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
    const [verifiedOnly, setVerifiedOnly] = useState(false)
    const [sortBy, setSortBy] = useState<'email' | 'role'>('email')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    // misc
    const [openCreate, setOpenCreate] = useState(false)
    const [featureFlags, setFlags] = useState<Record<string, boolean>>({
        multilang: true,
        exports: true,
        darkmode: false,
    })

    // users (loaded in effect to avoid touching localStorage during render)
    const [allUsers, setAllUsers] = useState<UserRow[]>([])

    useEffect(() => {
        try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem('users') : null
            const parsed = raw ? JSON.parse(raw) : []
            const rows: UserRow[] = Array.isArray(parsed)
                ? parsed.map((u: any) => ({
                    id: u.id,
                    email: u.email,
                    role: u.role as Role,
                    verified: !!u.verified,
                }))
                : []
            setAllUsers(rows)
        } catch {
            setAllUsers([])
        }
    }, [])

    const stats = useMemo(() => {
        const total = allUsers.length
        const verified = allUsers.filter(u => u.verified).length
        const admins = allUsers.filter(u => u.role === 'systemAdmin' || u.role === 'clientAdmin').length
        const support = allUsers.filter(u => u.role === 'support').length
        return { total, verified, admins, support }
    }, [allUsers])

    const rows = useMemo(() => {
        const filtered = allUsers
            .filter(u => (roleFilter === 'all' ? true : u.role === roleFilter))
            .filter(u => (verifiedOnly ? u.verified : true))
            .filter(u => [u.email, ROLE_LABEL[u.role]].join(' ').toLowerCase().includes(q.toLowerCase()))
            .sort((a, b) => {
                const dir = sortDir === 'asc' ? 1 : -1
                if (sortBy === 'email') return a.email.localeCompare(b.email) * dir
                return ROLE_LABEL[a.role].localeCompare(ROLE_LABEL[b.role]) * dir
            })
        return filtered
    }, [allUsers, q, roleFilter, verifiedOnly, sortBy, sortDir])

    useEffect(() => {
        if (isSysAdmin) (document.getElementById('sysadmin-search') as HTMLInputElement | null)?.focus()
    }, [isSysAdmin])

    // utilities for density
    const padCard = compact ? 'p-3' : 'p-5'
    const textBase = compact ? 'text-xs' : 'text-sm'
    const rowPad = compact ? 'py-1.5' : 'py-2.5'

    // export visible rows as CSV (runs only on click, safe)
    const exportCSV = () => {
        if (!rows.length) return
        const cols: (keyof UserRow)[] = ['email', 'role', 'verified', 'id']
        const header = ['email', 'role', 'verified', 'id'].join(',')
        const lines = rows.map(r =>
            cols
                .map(c => {
                    const v: any = c === 'role' ? ROLE_LABEL[r.role] : r[c]
                    return `"${String(v).replace(/"/g, '""')}"`
                })
                .join(',')
        )
        const csv = [header, ...lines].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'users.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="grid gap-4">
            {/* Gradient hero header */}
            <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
                            Administration
                        </div>
                        <h1 className="mt-2 text-2xl font-semibold">System Admin</h1>
                        <p className="text-sm text-white/90">Manage users, roles, and platform features.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-md hover:brightness-95"
                            onClick={() => setOpenCreate(true)}
                        >
                            Create user
                        </button>
                        <button
                            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/20"
                            onClick={exportCSV}
                        >
                            Export
                        </button>
                    </div>
                </div>

                {/* KPI row */}
                <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <KPI label="Total users" value={stats.total} tone="indigo" />
                    <KPI label="Verified" value={stats.verified} tone="emerald" />
                    <KPI label="Admins" value={stats.admins} tone="violet" />
                    <KPI label="Support" value={stats.support} tone="amber" />
                </div>
            </section>

            {!isSysAdmin ? (
                <div className={`rounded-xl border bg-white ${padCard}`}>
                    <h2 className="text-base font-semibold">Unauthorized</h2>
                    <p className="text-xs text-gray-600">This page is for System Admins only (sysadmin@demo.com).</p>
                </div>
            ) : (
                <>
                    {/* Sticky toolbar */}
                    <section className={`sticky top-16 z-10 rounded-xl border bg-white/95 backdrop-blur ${padCard}`}>
                        <div className="grid items-center gap-2 md:grid-cols-12">
                            <div className="md:col-span-4">
                                <input
                                    id="sysadmin-search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search by email or role…"
                                    className={`w-full rounded-lg border px-3 py-2 ${textBase} focus:ring-2 focus:ring-brand/40`}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <select
                                    className={`w-full rounded-lg border px-3 py-2 ${textBase}`}
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value as any)}
                                >
                                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <select
                                    className={`w-full rounded-lg border px-3 py-2 ${textBase}`}
                                    value={`${sortBy}:${sortDir}`}
                                    onChange={(e) => {
                                        const [by, dir] = e.target.value.split(':') as ['email' | 'role', 'asc' | 'desc']
                                        setSortBy(by); setSortDir(dir)
                                    }}
                                >
                                    <option value="email:asc">Email ↑</option>
                                    <option value="email:desc">Email ↓</option>
                                    <option value="role:asc">Role ↑</option>
                                    <option value="role:desc">Role ↓</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 flex items-center gap-3">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={verifiedOnly}
                                        onChange={() => setVerifiedOnly(v => !v)}
                                        className="h-4 w-4 accent-blue-600"
                                    />
                                    <span className={textBase}>Verified only</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={compact}
                                        onChange={() => setCompact(c => !c)}
                                        className="h-4 w-4 accent-blue-600"
                                    />
                                    <span className={textBase}>Compact</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Users table */}
                    <section className="rounded-xl border bg-white shadow-sm">
                        <header className={`section-header ${compact ? 'py-2' : ''}`}>
                            <h2 className="text-sm font-semibold text-gray-800">Users</h2>
                            <div className="text-xs text-gray-500">{rows.length} shown</div>
                        </header>

                        <div className="overflow-auto" style={{ maxHeight: 'calc(100dvh - 300px)' }}>
                            <table className={`min-w-full ${textBase}`}>
                                <thead className="sticky top-0 bg-white/95 backdrop-blur border-b text-gray-600">
                                    <tr>
                                        <th className={`px-3 ${rowPad} text-left`}>User</th>
                                        <th className={`px-3 ${rowPad} text-left`}>Role</th>
                                        <th className={`px-3 ${rowPad} text-left`}>Verified</th>
                                        <th className={`px-3 ${rowPad}`} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map(u => (
                                        <tr key={u.id} className="group relative transition hover:bg-indigo-50/40">
                                            {/* hover rail */}
                                            <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-0 transition group-hover:opacity-100" />
                                            <td className={`px-3 ${rowPad} font-medium`}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Avatar email={u.email} size={compact ? 7 : 8} />
                                                    <div className="min-w-0">
                                                        <div className="truncate text-gray-900">{u.email}</div>
                                                        <div className="truncate text-[10px] text-gray-500">{u.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-3 ${rowPad}`}>
                                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                                                    {ROLE_LABEL[u.role]}
                                                </span>
                                            </td>
                                            <td className={`px-3 ${rowPad}`}>
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${u.verified
                                                            ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                                                            : 'bg-slate-100 text-slate-700 ring-slate-200'
                                                        }`}
                                                >
                                                    {u.verified ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className={`px-3 ${rowPad} text-right`}>
                                                <div className="inline-flex gap-1">
                                                    <button
                                                        className="text-[11px] text-indigo-700 underline-offset-4 hover:underline"
                                                        onClick={() => alert(`Impersonate ${u.email} (demo)`)}
                                                    >
                                                        Impersonate
                                                    </button>
                                                    <button
                                                        className="text-[11px] text-indigo-700 underline-offset-4 hover:underline"
                                                        onClick={() => alert(`Reset password for ${u.email} (demo)`)}
                                                    >
                                                        Reset PW
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!rows.length && (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-10 text-center text-gray-600">
                                                No users match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Feature flags */}
                    <section className={`rounded-xl border bg-white ${padCard}`}>
                        <h2 className="mb-2 text-sm font-semibold text-gray-800">Feature flags</h2>
                        <div className="grid gap-2 md:grid-cols-3">
                            {Object.entries(featureFlags).map(([k, v]) => (
                                <label key={k} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-gray-50">
                                    <span className="text-sm capitalize">{k.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                                    <input
                                        type="checkbox"
                                        checked={v}
                                        onChange={() => setFlags((f) => ({ ...f, [k]: !f[k as keyof typeof f] }))}
                                        className="h-4 w-4 accent-blue-600"
                                    />
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Collapsible activity */}
                    <details className={`rounded-xl border bg-white ${padCard}`} open={false}>
                        <summary className="cursor-pointer text-sm font-semibold text-gray-800">Recent activity</summary>
                        <ul className="mt-2 space-y-1 text-sm text-gray-700">
                            <li>• Flag <b>exports</b> enabled by <span className="text-gray-600">sysadmin@demo.com</span></li>
                            <li>• User <b>support@demo.com</b> created via seed</li>
                            <li>• Password policy set to demo-only</li>
                        </ul>
                    </details>
                </>
            )}

            {/* Create user modal (demo) */}
            {openCreate && (
                <Modal onClose={() => setOpenCreate(false)} title="Create user">
                    <CreateUserForm onDone={() => { setOpenCreate(false); alert('User created (demo)') }} />
                </Modal>
            )}
        </div>
    )
}

/* ——— UI helpers ——— */

function KPI({ label, value, tone }: { label: string; value: number | string; tone: 'indigo' | 'emerald' | 'violet' | 'amber' }) {
    const stripe =
        tone === 'emerald' ? 'from-emerald-400 to-teal-500' :
            tone === 'violet' ? 'from-violet-400 to-fuchsia-500' :
                tone === 'amber' ? 'from-amber-400 to-orange-500' :
                    'from-indigo-400 to-violet-500'
    return (
        <div className="rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur">
            <div className="text-[11px] text-white/80">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <div className={`h-full bg-gradient-to-r ${stripe}`} style={{ width: '100%' }} />
            </div>
        </div>
    )
}

function Avatar({ email, size = 8 }: { email: string; size?: 7 | 8 }) {
    const initials = email.slice(0, 2).toUpperCase()
    const dim = size === 7 ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs'
    // gradient based on email hash-ish
    let h = 0; for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0
    const palette = [
        'from-indigo-500 to-violet-500',
        'from-fuchsia-500 to-pink-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-orange-500',
    ]
    const grad = palette[h % palette.length]
    return (
        <span className={`grid place-items-center rounded-full bg-gradient-to-br ${grad} font-semibold text-white ${dim}`}>
            {initials}
        </span>
    )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute left-0 right-0 top-[10vh] mx-auto w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold">{title}</h3>
                    <button className="btn-ghost" onClick={onClose}>Close</button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    )
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<Role>('applicant')
    const [verified, setVerified] = useState(true)

    return (
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onDone() }}>
            <label className="grid gap-1">
                <span className="text-sm text-gray-700">Email</span>
                <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="grid gap-1">
                <span className="text-sm text-gray-700">Role</span>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </label>
            <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={verified} onChange={() => setVerified(v => !v)} />
                <span className="text-sm text-gray-700">Verified</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
                <button className="btn-primary" type="submit">Create</button>
            </div>
            <p className="text-xs text-gray-500">Demo only — does not persist.</p>
        </form>
    )
}
