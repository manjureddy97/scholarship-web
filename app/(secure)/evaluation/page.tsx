// app/(secure)/evaluation/page.tsx
'use client'

import { useMemo, useState } from 'react'
import evaluations from '@/data/evaluations.json'

type Row = {
  id: string
  name: string
  academics: number
  service: number
  extracurricular: number
  work: number
}

const WEIGHTS = { academics: 0.6, service: 0.2, extracurricular: 0.15, work: 0.05 }

function weightedTotal(r: Row) {
  return (
    r.academics * WEIGHTS.academics +
    r.service * WEIGHTS.service +
    r.extracurricular * WEIGHTS.extracurricular +
    r.work * WEIGHTS.work
  )
}

/* ---------- extra mock data to fill table nicely ---------- */
function mockPeople(count: number): Row[] {
  const names = [
    'Priya Patel', 'Alex Kim', 'Jordan Garcia', 'Maya Singh', 'Ethan Chen', 'Nora Williams',
    'Diego Alvarez', 'Zara Khan', 'Owen Murphy', 'Lena Rossi', 'Fatima Noor', 'Kai Yamamoto',
    'Sofia Martins', 'Ibrahim El-Sayed', 'Ava Johnson', 'Leo Nguyen', 'Emma Brown', 'Noah Clark',
    'Luca Romano', 'Yara Haddad', 'Mina Park', 'Mateo Cruz'
  ]
  const clip = (n: number) => Math.max(50, Math.min(99, Math.round(n)))
  return Array.from({ length: count }, (_, i) => {
    const base = 75 + Math.random() * 20
    return {
      id: `mock-${i}`,
      name: names[i % names.length] + (i >= names.length ? ` ${i - names.length + 2}` : ''),
      academics: clip(base + (Math.random() * 10 - 5)),
      service: clip(base + (Math.random() * 12 - 6)),
      extracurricular: clip(base + (Math.random() * 14 - 7)),
      work: clip(base + (Math.random() * 16 - 8)),
    }
  })
}
const BASE_DATA: Row[] = [...(evaluations as Row[]), ...mockPeople(14)]

export default function Evaluation() {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'total'>('total')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [openStudent, setOpenStudent] = useState<(Row & { total: number; rank: number }) | null>(null)
  const [compact, setCompact] = useState(true)

  const rows = useMemo(() => {
    const base = BASE_DATA.map(r => ({ ...r, total: weightedTotal(r) }))
    const filtered = base.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    const sorted = filtered.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
      return (a.total - b.total) * dir
    })
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }))
  }, [query, sortBy, sortDir])

  // cohort averages (live with filter)
  const averages = useMemo(() => {
    if (!rows.length) {
      return { academics: 0, service: 0, extracurricular: 0, work: 0, total: 0 }
    }
    const sum = rows.reduce(
      (acc, r) => ({
        academics: acc.academics + r.academics,
        service: acc.service + r.service,
        extracurricular: acc.extracurricular + r.extracurricular,
        work: acc.work + r.work,
        total: acc.total + r.total,
      }),
      { academics: 0, service: 0, extracurricular: 0, work: 0, total: 0 },
    )
    const n = rows.length
    return {
      academics: Math.round(sum.academics / n),
      service: Math.round(sum.service / n),
      extracurricular: Math.round(sum.extracurricular / n),
      work: Math.round(sum.work / n),
      total: Number((sum.total / n).toFixed(2)),
    }
  }, [rows])

  const exportCSV = () => {
    if (!rows.length) return
    const cols = ['rank', 'name', 'academics', 'service', 'extracurricular', 'work', 'total']
    const header = cols.join(',')
    const lines = rows.map(r =>
      cols.map(c => {
        const v: any = (r as any)[c]
        const s = String(typeof v === 'number' ? (c === 'total' ? v.toFixed(2) : v) : v).replace(/"/g, '""')
        return `"${s}"`
      }).join(',')
    )
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'evaluation_scores.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const flipSort = (key: 'name' | 'total') => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }

  const padCard = compact ? 'p-4' : 'p-6'
  const textSm = compact ? 'text-xs' : 'text-sm'
  const rowPad = compact ? 'py-1.5' : 'py-2.5'

  return (
    <div className="grid gap-6">
      {/* Hero / controls */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-pink-500 p-5 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              Evaluator Portal
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Rank & review applicants</h1>
            <p className="text-sm text-white/90">
              Weights — Academics <b>60%</b>, Service <b>20%</b>, Extracurricular <b>15%</b>, Work <b>5%</b>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applicant…"
              className="w-56 rounded-lg border border-white/30 bg-white/90 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-md hover:brightness-95" onClick={exportCSV}>
              Export CSV
            </button>
          </div>
        </div>

        {/* KPI chips (“numbers above title”) */}
        <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KPI label="Avg Academics" value={averages.academics} tone="indigo" />
          <KPI label="Avg Service" value={averages.service} tone="emerald" />
          <KPI label="Avg Extracurricular" value={averages.extracurricular} tone="amber" />
          <KPI label="Avg Work" value={averages.work} tone="violet" />
          <KPI label="Avg Total" value={averages.total} tone="fuchsia" big />
        </div>

        {/* toolbar */}
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-white/15 px-2 py-1">Sorted by <b>{sortBy}</b> {sortBy === 'total' ? `(${sortDir})` : ''}</span>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={compact} onChange={() => setCompact(c => !c)} className="h-4 w-4 accent-white" />
            <span>Compact</span>
          </label>
        </div>
      </section>

      {/* Table */}
      <section className={`rounded-2xl border bg-white shadow-sm`}>
        <header className={`sticky top-14 z-10 flex items-center justify-between border-b bg-white/85 px-5 py-3 backdrop-blur`}>
          <h2 className="text-sm font-semibold text-gray-800">Scores</h2>
          <div className="text-xs text-gray-500">Showing {rows.length} applicants</div>
        </header>

        <div className="overflow-auto" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
          <table className={`min-w-full ${textSm}`}>
            <thead className="sticky top-[54px] bg-white/95 backdrop-blur border-b text-gray-600">
              <tr>
                <th className={`px-3 ${rowPad} text-left w-10`}>#</th>
                <ThButton label="Applicant" onClick={() => flipSort('name')} active={sortBy === 'name'} dir={sortDir} />
                <th className={`px-3 ${rowPad} text-left`}>Academics (60%)</th>
                <th className={`px-3 ${rowPad} text-left`}>Service (20%)</th>
                <th className={`px-3 ${rowPad} text-left`}>Extracurricular (15%)</th>
                <th className={`px-3 ${rowPad} text-left`}>Work (5%)</th>
                <ThButton label="Total" onClick={() => flipSort('total')} active={sortBy === 'total'} dir={sortDir} />
                <th className={`px-3 ${rowPad}`} />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="group transition hover:bg-indigo-50/40 relative">
                  {/* hover rail */}
                  <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-0 transition group-hover:opacity-100" />
                  <td className={`px-3 ${rowPad}`}>
                    <RankBadge rank={r.rank} />
                  </td>

                  <td className={`px-3 ${rowPad}`}>
                    <button className="text-indigo-600 hover:underline underline-offset-4" onClick={() => setOpenStudent(r)}>
                      {r.name}
                    </button>
                  </td>

                  <td className={`px-3 ${rowPad}`}><ScoreBar value={r.academics} weight={WEIGHTS.academics} /></td>
                  <td className={`px-3 ${rowPad}`}><ScoreBar value={r.service} weight={WEIGHTS.service} tone="green" /></td>
                  <td className={`px-3 ${rowPad}`}><ScoreBar value={r.extracurricular} weight={WEIGHTS.extracurricular} tone="amber" /></td>
                  <td className={`px-3 ${rowPad}`}><ScoreBar value={r.work} weight={WEIGHTS.work} tone="indigo" /></td>

                  <td className={`px-3 ${rowPad}`}>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                      {r.total.toFixed(2)}
                    </span>
                  </td>

                  <td className={`px-3 ${rowPad} text-right`}>
                    <button className="btn-ghost text-[11px]" onClick={() => alert(`Open full application for ${r.name} (demo)`)}>View application →</button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-gray-500">No applicants match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Student Drawer */}
      <StudentDrawer student={openStudent} onClose={() => setOpenStudent(null)} />
    </div>
  )
}

/* ---------- bits ---------- */

function ThButton({
  label, onClick, active, dir,
}: { label: string; onClick: () => void; active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <th className="px-3">
      <button
        onClick={onClick}
        className={`flex items-center gap-1 hover:underline underline-offset-4 ${active ? 'font-medium text-gray-900' : 'text-gray-600'}`}
      >
        {label}{active && <span className="text-[10px] text-gray-500">{dir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  )
}

function ScoreBar({
  value, weight, tone = 'blue',
}: { value: number; weight: number; tone?: 'blue' | 'green' | 'amber' | 'indigo' }) {
  const width = Math.max(4, Math.min(100, value))
  const color =
    tone === 'green' ? 'from-green-500 to-emerald-500'
      : tone === 'amber' ? 'from-amber-500 to-orange-500'
        : tone === 'indigo' ? 'from-indigo-500 to-violet-500'
          : 'from-blue-500 to-indigo-500'

  return (
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span>{value}</span>
        <span>{Math.round(weight * 100)}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const is1 = rank === 1, is2 = rank === 2, is3 = rank === 3
  const medal = is1 ? '🥇' : is2 ? '🥈' : is3 ? '🥉' : ''
  const tone =
    is1 ? 'bg-amber-100 text-amber-800 ring-amber-200' :
      is2 ? 'bg-gray-100 text-gray-800 ring-gray-200' :
        is3 ? 'bg-orange-100 text-orange-800 ring-orange-200' :
          'bg-slate-100 text-slate-700 ring-slate-200'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tone}`}>
      {rank} {medal}
    </span>
  )
}

function KPI({ label, value, tone, big = false }: { label: string; value: number; tone: 'indigo' | 'emerald' | 'amber' | 'violet' | 'fuchsia'; big?: boolean }) {
  const stripe =
    tone === 'emerald' ? 'from-emerald-400 to-teal-500' :
      tone === 'amber' ? 'from-amber-400 to-orange-500' :
        tone === 'violet' ? 'from-violet-400 to-fuchsia-500' :
          tone === 'fuchsia' ? 'from-fuchsia-400 to-pink-500' :
            'from-indigo-400 to-violet-500'
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 p-3 backdrop-blur">
      <div className="text-[11px] text-white/80">{label}</div>
      <div className={`${big ? 'text-2xl' : 'text-xl'} font-semibold`}>{value}</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
        <div className={`h-full bg-gradient-to-r ${stripe}`} style={{ width: '100%' }} />
      </div>
    </div>
  )
}

function StudentDrawer({
  student, onClose,
}: { student: (Row & { total: number; rank: number }) | null; onClose: () => void }) {
  if (!student) return null
  const docs = [
    { name: 'Transcript.pdf', status: 'Verified' },
    { name: 'Resume.pdf', status: 'Received' },
    { name: 'FAFSA.pdf', status: '—' },
  ]
  const summary =
    'Motivated student with strong STEM focus. Leadership in robotics club; 120+ hours of community tutoring. Seeking support to pursue CS with focus on AI ethics.'

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl animate-slideIn overflow-hidden rounded-l-2xl border bg-white/80 backdrop-blur-xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/70 backdrop-blur-lg px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">{student.name}</h3>
            <p className="text-xs text-gray-500">Rank #{student.rank} • Total {student.total.toFixed(2)}</p>
          </div>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="grid gap-4 p-5">
          {/* Snapshot */}
          <section className="rounded-2xl border bg-white p-4">
            <h4 className="mb-2 font-semibold">Snapshot</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Academics" value={student.academics} />
              <Item label="Service" value={student.service} />
              <Item label="Extracurricular" value={student.extracurricular} />
              <Item label="Work" value={student.work} />
            </div>
          </section>

          {/* Statement */}
          <section className="rounded-2xl border bg-white p-4">
            <h4 className="mb-2 font-semibold">Statement (excerpt)</h4>
            <p className="text-sm text-gray-700">{summary}</p>
          </section>

          {/* Documents */}
          <section className="rounded-2xl border bg-white p-4">
            <h4 className="mb-2 font-semibold">Documents</h4>
            <ul className="divide-y divide-gray-100">
              {docs.map(d => (
                <li key={d.name} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-800">{d.name}</span>
                  <span className={`badge ${d.status === 'Verified' ? 'badge-green' :
                      d.status === 'Received' ? 'badge-brand' : 'badge-muted'
                    }`}>
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Notes (demo) */}
          <section className="rounded-2xl border bg-white p-4">
            <h4 className="mb-2 font-semibold">Evaluator note</h4>
            <textarea rows={3} placeholder="Leave a quick note (demo, not persisted)…" className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-brand/40" />
            <div className="mt-2">
              <button className="btn-outline text-sm" onClick={() => alert('Saved (demo)')}>Save note</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Item({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

/* lightweight animations (no deps) */
const css = `
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
.animate-fadeIn { animation: fadeIn .25s ease-in-out; }
.animate-slideIn { animation: slideIn .25s ease-out; }
`
if (typeof document !== 'undefined' && !document.getElementById('eval-anim')) {
  const s = document.createElement('style')
  s.id = 'eval-anim'
  s.innerHTML = css
  document.head.appendChild(s)
}
