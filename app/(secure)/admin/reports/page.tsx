'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import reports from '@/data/reports.json'

type KPI = { label: string; value: number; delta?: number }
const icons: Record<string, string> = {
  started: '🟦',
  submitted: '📤',
  approved: '✅',
  default: '📊',
}

function iconFor(label: string) {
  const key = label.toLowerCase()
  if (key.includes('started')) return icons.started
  if (key.includes('submitted')) return icons.submitted
  if (key.includes('approved')) return icons.approved
  return icons.default
}

type DrawerState = { open: boolean; title: string; rows: any[] }

export default function ReportsPage() {
  const [range, setRange] = useState<'30d' | '90d' | 'ytd'>('90d')
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, title: '', rows: [] })

  const kpis = reports.kpis as KPI[]
  const maxVal = useMemo(() => Math.max(...kpis.map(k => Number(k.value) || 0), 1), [kpis])
  const norm = (v: number) => `${Math.max(8, Math.min(100, Math.round((v / maxVal) * 100)))}%`

  const makeRows = (label: string) =>
    Array.from({ length: 10 }).map((_, i) => ({
      id: `APP-${2000 + i}`,
      applicant: ['Alex Johnson', 'Priya Kumar', 'Jordan Lee', 'Sam Rivera', 'Kai Chen'][i % 5],
      program: ['BlueSky Scholars 2025', 'STEM Excellence 2025', 'Community Impact 2025'][i % 3],
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      status: label,
      amount: ['$1,000', '$1,500', '$2,000'][i % 3],
    }))

  const openDrawer = (title: string) => setDrawer({ open: true, title, rows: makeRows(title) })
  const closeDrawer = () => setDrawer({ open: false, title: '', rows: [] })

  return (
    <div className="grid gap-6 animate-fadeIn">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              Operational insights
            </div>
            <h1 className="mt-2 text-2xl font-semibold">📊 Reports</h1>
            <p className="text-sm text-white/90">Click any metric below to explore detailed records.</p>
          </div>

          <div className="flex gap-2">
            {(['30d', '90d', 'ytd'] as const).map(v => {
              const active = range === v
              return (
                <button
                  key={v}
                  onClick={() => setRange(v)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ring-1 ring-white/30 ${active
                    ? 'bg-white text-indigo-700 shadow'
                    : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  {v.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Standard reports */}
      <section className="rounded-2xl border bg-gradient-to-br from-white via-gray-50 to-blue-50/30 p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Standard Reports</h2>
        <ul className="divide-y divide-gray-100">
          {reports.standard.map((r: any) => (
            <li key={r.id} className="group relative flex items-start justify-between gap-4 py-3">
              <span className="absolute left-0 top-0 h-full w-1 rounded-l bg-gradient-to-b from-indigo-500 to-fuchsia-500 opacity-0 transition group-hover:opacity-100" />
              <div>
                <div className="font-medium text-gray-900">{r.title}</div>
                <div className="text-sm text-gray-600">{r.description}</div>
              </div>
              <button
                onClick={() => openDrawer(r.title)}
                className="btn-outline text-xs hover:bg-white hover:text-indigo-600"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* KPI cards */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Totals</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {kpis.map(k => (
            <KpiCard
              key={k.label}
              label={k.label}
              value={k.value}
              delta={k.delta}
              progressWidth={norm(k.value)}
              onOpen={() => openDrawer(k.label)}
            />
          ))}
        </div>
      </section>

      {/* Drawer */}
      <Drawer open={drawer.open} title={drawer.title} rows={drawer.rows} onClose={closeDrawer} />
    </div>
  )
}

/* ---------- UI bits ---------- */

function KpiCard({
  label, value, delta, progressWidth, onOpen,
}: { label: string; value: number; delta?: number; progressWidth: string; onOpen: () => void }) {
  const icon = iconFor(label)
  const trend = useMemo(() => makeTrend(label, value), [label, value])
  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-tr from-blue-50/50 to-indigo-50/30 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-base text-white shadow-sm">
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {typeof delta === 'number' && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${delta >= 0
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-amber-50 text-amber-700 ring-amber-200'
            }`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>

      <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
        {value.toLocaleString()}
      </div>

      {/* progress bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
          style={{ width: progressWidth }}
        />
      </div>

      {/* sparkline */}
      <div className="mt-3">
        <Sparkline data={trend} />
      </div>

      <span className="absolute bottom-3 right-4 text-xs text-indigo-600 opacity-0 transition group-hover:opacity-100">
        View details →
      </span>
    </div>
  )
}

/** tiny inline sparkline (no deps) */
function Sparkline({ data }: { data: number[] }) {
  const w = 180, h = 42, pad = 2
  const min = Math.min(...data), max = Math.max(...data)
  const scaleX = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2)
  const scaleY = (v: number) => {
    if (max === min) return h / 2
    return h - pad - ((v - min) / (max - min)) * (h - pad * 2)
  }
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
  return (
    <svg width={w} height={h} className="block">
      <rect x="0" y="0" width={w} height={h} rx="8" className="fill-white/60" />
      <path d={d} className="stroke-indigo-500 fill-none" strokeWidth={2} />
      {/* last dot */}
      <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1])} r="3" className="fill-fuchsia-500" />
    </svg>
  )
}

/** deterministic-ish faux trend so cards feel alive */
function makeTrend(seed: string, base: number) {
  // generate 16 points based on seed hash + base
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const arr: number[] = []
  for (let i = 0; i < 16; i++) {
    h = (h * 1664525 + 1013904223) >>> 0
    const n = (h % 1000) / 1000 // 0..1
    const jitter = (n - 0.5) * 0.18 // +/- 9%
    arr.push(base * (0.85 + jitter))
  }
  return arr
}

/* Drawer with search & CSV export */
function Drawer({
  open, title, rows, onClose,
}: { open: boolean; title: string; rows: any[]; onClose: () => void }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const str = q.toLowerCase()
    return rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(str)))
  }, [rows, q])

  const cols = filtered.length ? Object.keys(filtered[0]) : []
  const escHandler = useRef<(e: KeyboardEvent) => void>()
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    escHandler.current = h
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const copyCSV = () => {
    if (!filtered.length) return
    const header = cols.join(',')
    const lines = filtered.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))
    navigator.clipboard.writeText([header, ...lines].join('\n'))
    alert('Copied CSV to clipboard (demo)')
  }

  const downloadCSV = () => {
    if (!filtered.length) return
    const header = cols.join(',')
    const lines = filtered.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative h-full w-full max-w-3xl animate-slideIn overflow-hidden rounded-l-2xl border bg-white/80 backdrop-blur-xl shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b bg-white/70 backdrop-blur-lg px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">Showing {filtered.length} of {rows.length} records</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-48 rounded-lg border px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300"
            />
            <button onClick={copyCSV} className="btn-ghost text-xs">Copy CSV</button>
            <button onClick={downloadCSV} className="btn-outline text-xs">Download</button>
            <button onClick={onClose} className="btn-ghost text-sm">Close</button>
          </div>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(100vh-70px)]">
          {filtered.length ? (
            <table className="min-w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-lg border-b text-gray-600">
                <tr>
                  {cols.map(c => (
                    <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={i}
                    className={`transition hover:bg-indigo-50/40 ${i % 2 === 0 ? 'bg-white/60' : 'bg-gray-50/40'}`}
                  >
                    {cols.map(c => (
                      <td key={c} className="px-3 py-2 whitespace-nowrap text-gray-800">
                        {r[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No data matches your search.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* Animations (attach once) */
const styles = `
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
.animate-fadeIn { animation: fadeIn .25s ease-in-out; }
.animate-slideIn { animation: slideIn .25s ease-out; }
`
if (typeof document !== 'undefined' && !document.getElementById('report-anim')) {
  const style = document.createElement('style')
  style.id = 'report-anim'
  style.innerHTML = styles
  document.head.appendChild(style)
}
