'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import appsData from '@/data/applications.json'
import notices from '@/data/notifications.json'
import DeadlineCountdown from '@/components/dashboard/DeadlineCountdown'

type AppItem = { id: string; programName: string; status: string; amount?: string; due?: string }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'In Progress': 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    'Submitted': 'bg-slate-100 text-slate-800 ring-1 ring-slate-200',
    'Complete': 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    'Action Required': 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  }
  const cls = map[status] ?? 'bg-gray-100 text-gray-800 ring-1 ring-gray-200'
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
}

export default function Dashboard() {
  const [apps, setApps] = useState<AppItem[]>([])
  useEffect(() => { setApps(appsData as any) }, [])

  const metrics = useMemo(() => {
    const total = apps.length
    const submitted = apps.filter(a => ['Submitted', 'Complete'].includes(a.status)).length
    const complete = apps.filter(a => a.status === 'Complete').length
    const completionRate = total ? Math.round((complete / total) * 100) : 0
    return { total, submitted, complete, completionRate }
  }, [apps])

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <span>Welcome back</span> <span>🎓</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Your Applications</h1>
          <p className="text-sm/relaxed text-white/90">Track progress, deadlines, and renewal eligibility.</p>

          {/* Stats */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total" value={metrics.total} />
            <StatCard label="Submitted" value={metrics.submitted} tone="indigo" />
            <StatCard label="Complete" value={metrics.complete} tone="emerald" />
            <StatCard label="Completion" value={`${metrics.completionRate}%`} tone="fuchsia" barPct={metrics.completionRate} />
          </div>

          <div className="mt-5">
            <Link
              href="/applications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-md transition hover:brightness-95"
            >
              ✨ Start new
            </Link>
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <header className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Applications</h2>
          <Link href="/applications" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
        </header>
        <ul className="divide-y">
          {apps.map(a => (
            <li key={a.id} className="group relative p-5 transition hover:bg-indigo-50/40">
              {/* left accent */}
              <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-fuchsia-500 opacity-0 transition group-hover:opacity-100" />
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-base font-medium text-gray-900">{a.programName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <StatusBadge status={a.status} />
                    {a.amount && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">Award {a.amount}</span>}
                    {a.due && <span className="text-xs text-gray-500">Due: {a.due}</span>}
                  </div>
                </div>
                <Link
                  href={`/applications/${a.id}`}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  Open →
                </Link>
              </div>
            </li>
          ))}
          {!apps.length && (
            <li className="p-6 text-center text-sm text-gray-600">No applications yet. Start a new one!</li>
          )}
        </ul>
      </section>

      {/* Two-up */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
            ⏳ Deadlines
          </div>
          <DeadlineCountdown deadlineISO="2026-01-01T23:59:59Z" />
          <p className="mt-3 text-sm text-gray-600">
            Keep an eye on document requirements and essay prompts before submitting.
          </p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm ring-1 ring-emerald-100">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            ♻️ Renewal
          </div>
          <p className="text-sm text-gray-800">
            You are eligible for renewal for program <b>BlueSky Scholars 2025</b>.{' '}
            <Link className="text-emerald-700 underline-offset-4 hover:underline" href="/renewals">Renew now</Link>
          </p>
        </div>
      </div>

      {/* Notifications */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">Notifications</h2>
        <ul className="space-y-3">
          {(notices as any[]).map((n) => (
            <li key={n.id} className="flex items-start gap-3">
              <Badge tone={n.type === 'alert' ? 'rose' : n.type === 'success' ? 'emerald' : 'indigo'}>
                {n.type === 'alert' ? 'Alert' : n.type === 'success' ? 'Success' : 'Info'}
              </Badge>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{n.title}</div>
                <div className="text-gray-600">{n.message}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* — small UI helpers — */

function StatCard({
  label, value, tone = 'indigo', barPct,
}: { label: string; value: string | number; tone?: 'indigo' | 'emerald' | 'fuchsia'; barPct?: number }) {
  const stripe =
    tone === 'emerald'
      ? 'from-emerald-400 to-teal-500'
      : tone === 'fuchsia'
        ? 'from-fuchsia-400 to-pink-500'
        : 'from-indigo-400 to-violet-500'

  return (
    <div className="rounded-2xl border border-white/40 bg-white/10 p-4 backdrop-blur">
      <div className="text-xs text-white/80">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
        <div
          className={`h-full bg-gradient-to-r ${stripe}`}
          style={{ width: `${Math.min(100, barPct ?? 100)}%` }}
        />
      </div>
    </div>
  )
}

function Badge({ tone, children }: { tone: 'rose' | 'emerald' | 'indigo'; children: React.ReactNode }) {
  const cls =
    tone === 'rose'
      ? 'bg-rose-100 text-rose-800 ring-rose-200'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
        : 'bg-indigo-100 text-indigo-800 ring-indigo-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      {children}
    </span>
  )
}
