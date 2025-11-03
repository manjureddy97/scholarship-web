'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/auth.context'

type Ticket = {
    id: string
    subject: string
    requester: string
    priority: 'Low' | 'Normal' | 'High'
    status: 'Open' | 'Waiting' | 'Closed'
    createdAt: string
}

const MOCK_TICKETS: Ticket[] = [
    { id: 'T-1024', subject: 'Can’t upload transcript', requester: 'Priya Patel', priority: 'High', status: 'Open', createdAt: '2025-10-14 09:42' },
    { id: 'T-1025', subject: 'Portal language not saving', requester: 'Alex Kim', priority: 'Normal', status: 'Waiting', createdAt: '2025-10-15 12:10' },
    { id: 'T-1026', subject: 'Password reset loop', requester: 'Jordan Garcia', priority: 'High', status: 'Open', createdAt: '2025-10-15 15:22' },
    { id: 'T-1027', subject: 'Email verification bounced', requester: 'Maya Singh', priority: 'Low', status: 'Closed', createdAt: '2025-10-13 18:03' },
]

type FilterKey = 'all' | 'open' | 'waiting' | 'closed' | 'high'

export default function SupportPage() {
    const { user } = useAuth()
    const [q, setQ] = useState('')
    const [filter, setFilter] = useState<FilterKey>('all')
    const [compact, setCompact] = useState(true)

    // stats — computed once per render
    const stats = useMemo(() => {
        const open = MOCK_TICKETS.filter(t => t.status === 'Open').length
        const waiting = MOCK_TICKETS.filter(t => t.status === 'Waiting').length
        const closed = MOCK_TICKETS.filter(t => t.status === 'Closed').length
        const high = MOCK_TICKETS.filter(t => t.priority === 'High' && t.status !== 'Closed').length
        return { open, waiting, closed, high, total: MOCK_TICKETS.length }
    }, [])

    const rows = useMemo(() => {
        let base = [...MOCK_TICKETS]
        if (filter === 'open') base = base.filter(t => t.status === 'Open')
        if (filter === 'waiting') base = base.filter(t => t.status === 'Waiting')
        if (filter === 'closed') base = base.filter(t => t.status === 'Closed')
        if (filter === 'high') base = base.filter(t => t.priority === 'High' && t.status !== 'Closed')
        const str = q.toLowerCase()
        return base.filter(t => [t.id, t.subject, t.requester].join(' ').toLowerCase().includes(str))
    }, [q, filter])

    const isSupport = user?.role === 'support'

    const rowPad = compact ? 'py-2' : 'py-3'
    const textSm = compact ? 'text-xs' : 'text-sm'

    return (
        <div className="grid gap-6">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
                            Support workspace
                        </div>
                        <h1 className="mt-2 text-2xl font-semibold">Triage & help applicants</h1>
                        <p className="text-sm text-white/90">Search, filter, and resolve tickets quickly.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            placeholder="Search tickets…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-64 rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <label className="ml-1 inline-flex items-center gap-2 text-xs">
                            <input type="checkbox" className="h-4 w-4 accent-white" checked={compact} onChange={() => setCompact(c => !c)} />
                            Compact
                        </label>
                    </div>
                </div>

                {/* Filters */}
                <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                    {([
                        { k: 'all', label: 'All', count: stats.total },
                        { k: 'open', label: 'Open', count: stats.open },
                        { k: 'waiting', label: 'Waiting', count: stats.waiting },
                        { k: 'closed', label: 'Closed', count: stats.closed },
                        { k: 'high', label: 'High Priority', count: stats.high },
                    ] as { k: FilterKey; label: string; count: number }[]).map(chip => {
                        const active = filter === chip.k
                        return (
                            <button
                                key={chip.k}
                                onClick={() => setFilter(chip.k)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ring-1 ring-white/30 ${active ? 'bg-white text-indigo-700 shadow' : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {chip.label} <span className={`ml-1 rounded-full px-1.5 ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-white/20 text-white/90'}`}>{chip.count}</span>
                            </button>
                        )
                    })}
                </div>
            </section>

            {!isSupport ? (
                <div className="rounded-2xl border bg-white p-6">
                    <h2 className="text-lg font-semibold">Unauthorized</h2>
                    <p className="text-sm text-gray-600">This page is for Support users only (support@demo.com).</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <section className="grid gap-4 md:grid-cols-4">
                        <StatCard label="Open" value={stats.open} tone="indigo" />
                        <StatCard label="Waiting" value={stats.waiting} tone="violet" />
                        <StatCard label="High priority" value={stats.high} tone="amber" />
                        <StatCard label="Closed (7d)" value={stats.closed} tone="emerald" />
                    </section>

                    {/* Tickets */}
                    <section className="rounded-2xl border bg-white shadow-sm">
                        <header className="sticky top-14 z-10 flex items-center justify-between border-b bg-white/85 px-5 py-3 backdrop-blur">
                            <h2 className="text-sm font-semibold text-gray-800">Tickets</h2>
                            <div className="text-xs text-gray-500">Showing {rows.length} of {stats.total}</div>
                        </header>

                        <div className="overflow-auto" style={{ maxHeight: 'calc(100dvh - 300px)' }}>
                            <table className={`min-w-full ${textSm}`}>
                                <thead className="sticky top-[54px] bg-white/95 backdrop-blur border-b text-gray-600">
                                    <tr>
                                        <th className={`px-3 ${rowPad} text-left`}>ID</th>
                                        <th className={`px-3 ${rowPad} text-left`}>Subject</th>
                                        <th className={`px-3 ${rowPad} text-left`}>Requester</th>
                                        <th className={`px-3 ${rowPad} text-left`}>Priority</th>
                                        <th className={`px-3 ${rowPad} text-left`}>Status</th>
                                        <th className={`px-3 ${rowPad} text-left`}>Created</th>
                                        <th className={`px-3 ${rowPad}`} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map(t => (
                                        <tr key={t.id} className="group relative transition hover:bg-indigo-50/40">
                                            {/* left rail by priority */}
                                            <span className={`pointer-events-none absolute left-0 top-0 h-full w-1
                        ${t.priority === 'High' ? 'bg-gradient-to-b from-rose-500 to-orange-500'
                                                    : t.priority === 'Normal' ? 'bg-gradient-to-b from-indigo-500 to-fuchsia-500'
                                                        : 'bg-gradient-to-b from-slate-400 to-slate-500'}
                        opacity-0 group-hover:opacity-100`} />
                                            <td className={`px-3 ${rowPad} font-medium text-gray-900`}>{t.id}</td>
                                            <td className={`px-3 ${rowPad}`}>
                                                <div className="font-medium text-gray-900">{t.subject}</div>
                                                <div className="text-[11px] text-gray-500">Scholarship Portal</div>
                                            </td>
                                            <td className={`px-3 ${rowPad}`}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar name={t.requester} />
                                                    <span className="text-gray-800">{t.requester}</span>
                                                </div>
                                            </td>
                                            <td className={`px-3 ${rowPad}`}>
                                                <Badge tone={t.priority === 'High' ? 'amber' : t.priority === 'Normal' ? 'indigo' : 'slate'}>
                                                    {t.priority}
                                                </Badge>
                                            </td>
                                            <td className={`px-3 ${rowPad}`}>
                                                <Badge tone={t.status === 'Open' ? 'indigo' : t.status === 'Waiting' ? 'violet' : 'emerald'}>
                                                    {t.status}
                                                </Badge>
                                            </td>
                                            <td className={`px-3 ${rowPad}`}>{t.createdAt}</td>
                                            <td className={`px-3 ${rowPad} text-right`}>
                                                <button
                                                    className="text-[11px] text-indigo-700 underline-offset-4 hover:underline"
                                                    onClick={() => alert(`Open ${t.id} (demo)`)}
                                                >
                                                    Open →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!rows.length && (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-10 text-center text-gray-500">No tickets match your search.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}

/* ---------- UI bits ---------- */

function Avatar({ name }: { name: string }) {
    const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
    // hash-ish color seed
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
    const palette = [
        'from-indigo-500 to-violet-500',
        'from-fuchsia-500 to-pink-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-orange-500'
    ]
    const grad = palette[h % palette.length]
    return (
        <span className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${grad} text-[11px] font-semibold text-white`}>
            {initials}
        </span>
    )
}

function Badge({ tone, children }: { tone: 'indigo' | 'violet' | 'emerald' | 'amber' | 'slate', children: React.ReactNode }) {
    const cls =
        tone === 'emerald' ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' :
            tone === 'amber' ? 'bg-amber-100 text-amber-800 ring-amber-200' :
                tone === 'violet' ? 'bg-violet-100 text-violet-800 ring-violet-200' :
                    tone === 'slate' ? 'bg-slate-100 text-slate-800 ring-slate-200' :
                        'bg-indigo-100 text-indigo-800 ring-indigo-200'
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>{children}</span>
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: 'indigo' | 'violet' | 'amber' | 'emerald' }) {
    const stripe =
        tone === 'emerald' ? 'from-emerald-400 to-teal-500' :
            tone === 'amber' ? 'from-amber-400 to-orange-500' :
                tone === 'violet' ? 'from-violet-400 to-fuchsia-500' :
                    'from-indigo-400 to-violet-500'
    return (
        <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 flex items-end gap-2">
                <div className="text-2xl font-semibold">{value}</div>
                <div className={`h-1.5 flex-1 rounded-full bg-gradient-to-r ${stripe}`} />
            </div>
        </div>
    )
}
