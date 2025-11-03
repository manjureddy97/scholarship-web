'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import ApplicantDemographicsSection from '@/components/forms/ApplicantDemographicsSection'
import ParentInfoSection from '@/components/forms/ParentInfoSection'
import EligibilitySection from '@/components/forms/EligibilitySection'
import AcademicInfoSection from '@/components/forms/AcademicInfoSection'
import ActivitiesTable from '@/components/forms/ActivitiesTable'
import HonorsTable from '@/components/forms/HonorsTable'
import CommunityServiceTable from '@/components/forms/CommunityServiceTable'
import WorkExperienceTable from '@/components/forms/WorkExperienceTable'
import EssaySection from '@/components/forms/EssaySection'
import TermsSection from '@/components/forms/TermsSection'
import { OCRSection } from '@/components/forms/OCRSection'

/* ----------------------- Validation schema ----------------------- */
const Schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone'),
  address: z.string().min(5, 'Enter a valid address'),
  smsOptIn: z.boolean().default(false),

  parent: z.object({
    relationship: z.string().optional(),
    name: z.string().optional(),
    location: z.string().optional(),
    status: z.string().optional(),
    hireDate: z.string().optional(),
  }).optional(),

  eligibility: z.object({
    geo: z.string(),
    gpaMin: z.number().min(0).max(4),
  }),

  academic: z.object({
    status: z.string(),
    state: z.string(),
    institution: z.string(),
    degree: z.string(),
    major: z.string(),
    gradDate: z.string(),
    gpa: z.number().min(0).max(5),
  }),

  activities: z.array(z.object({
    org: z.string(),
    desc: z.string().optional(),
    role: z.string().optional(),
    years: z.string().optional(),
    current: z.boolean().optional(),
  })).default([]),

  honors: z.array(z.object({
    name: z.string(),
    desc: z.string().optional(),
    year: z.string(),
  })).default([]),

  community: z.array(z.object({
    org: z.string(),
    desc: z.string().optional(),
    hours: z.coerce.number().optional(),
    duration: z.string().optional(),
    current: z.boolean().optional(),
  })).default([]),

  work: z.array(z.object({
    employer: z.string(),
    title: z.string(),
    desc: z.string().optional(),
    start: z.string(),
    end: z.string().optional(),
  })).default([]),

  essay: z.string().min(100, 'Essay must be at least 100 characters'),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),

  // Internal toggle (set by OCRSection when parsing succeeds)
  hasDocuments: z.boolean().optional().default(false),
})

type FormValues = z.infer<typeof Schema>

type SectionKey =
  | 'demographics' | 'parent' | 'eligibility' | 'academic'
  | 'documents' | 'activities' | 'honors' | 'community' | 'work' | 'essay' | 'terms'

const SECTIONS: Array<{ key: SectionKey; label: string; icon: string }> = [
  { key: 'demographics', label: 'Applicant Demographics', icon: '👤' },
  { key: 'parent', label: 'Parent/Employee', icon: '🏢' },
  { key: 'eligibility', label: 'Eligibility', icon: '✅' },
  { key: 'academic', label: 'Academic Info', icon: '🎓' },
  // We don’t show a chip for Documents on purpose; the Activities chip shows completion if OCR/docs are present.
  { key: 'activities', label: 'Activities', icon: '🏅' },
  { key: 'honors', label: 'Honors', icon: '🏆' },
  { key: 'community', label: 'Community Service', icon: '🤝' },
  { key: 'work', label: 'Work Experience', icon: '💼' },
  { key: 'essay', label: 'Essay', icon: '✍️' },
  { key: 'terms', label: 'Terms & Signature', icon: '📝' },
]

/* ----------------------- storage helpers ----------------------- */
const DRAFT_VERSION = 1
const DRAFT_KEY = `scholarshipapp:draft:v${DRAFT_VERSION}`

function safeGetLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function loadDraft(): Partial<FormValues> | null {
  const ls = safeGetLocalStorage()
  if (!ls) return null
  try {
    const raw = ls.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // place for simple migrations if you bump DRAFT_VERSION later
    return parsed ?? null
  } catch {
    return null
  }
}

function saveDraftToStorage(values: FormValues) {
  const ls = safeGetLocalStorage()
  if (!ls) return
  try {
    ls.setItem(DRAFT_KEY, JSON.stringify(values))
  } catch {
    // ignore quota errors, etc.
  }
}

export default function NewApplicationPage() {
  const router = useRouter()

  const methods = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      smsOptIn: false,
      acceptedTerms: false,
      hasDocuments: false,
    },
    mode: 'onTouched',
  })

  const { handleSubmit, getValues, watch, formState, reset } = methods
  const values = watch()

  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [active, setActive] = useState<SectionKey>('demographics')
  const [errorToast, setErrorToast] = useState<string | null>(null)

  // refs for scroll targets
  const refs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    demographics: null,
    parent: null,
    eligibility: null,
    academic: null,
    documents: null,
    activities: null,
    honors: null,
    community: null,
    work: null,
    essay: null,
    terms: null,
  })

  // Load any existing draft into the form on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      reset({ ...methods.getValues(), ...draft })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // completeness (for step chips + sidebar)
  const checklist = useMemo(() => ([
    { key: 'demographics', done: !!values.fullName && !!values.email && !!values.address },
    { key: 'eligibility', done: !!values.eligibility?.geo && (values.eligibility?.gpaMin ?? -1) >= 0 },
    { key: 'academic', done: !!values.academic?.status && !!values.academic?.institution },
    { key: 'essay', done: (values.essay?.length ?? 0) >= 100 },
    {
      key: 'documents',
      // Count as done if OCR/Docs present or any of activities/honors/community have entries
      done:
        !!values.hasDocuments ||
        ((values.activities?.length ?? 0) + (values.honors?.length ?? 0) + (values.community?.length ?? 0) >= 1),
    },
    { key: 'terms', done: values.acceptedTerms === true },
  ]), [values])

  const pct = Math.round(
    (checklist.filter(c => c.done).length / checklist.length) * 100
  )

  const saveDraft = useCallback(async (snapshot?: FormValues) => {
    setSaving(true)
    const payload = snapshot ?? getValues()
    saveDraftToStorage(payload)
    // small UX delay for the saving state
    await new Promise(r => setTimeout(r, 180))
    setSaving(false)
    setLastSaved(new Date())
  }, [getValues])

  const onSubmit = useCallback((v: FormValues) => {
    // Final local persistence — backend submission can go here later
    saveDraftToStorage(v)
    alert('Saved & submitted (demo). Redirecting to Dashboard.')
    router.replace('/dashboard')
  }, [router])

  // Debounced autosave on any change while dirty
  useEffect(() => {
    if (!formState.isDirty) return
    const id = setTimeout(() => {
      void saveDraft()
    }, 1500) // debounce
    return () => clearTimeout(id)
  }, [values, formState.isDirty, saveDraft])

  // Save before unload/refresh
  useEffect(() => {
    const handler = () => {
      try {
        const snapshot = getValues()
        saveDraftToStorage(snapshot)
      } catch {
        // ignore
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [getValues])

  // scroll-spy (IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) setActive(visible.target.id as SectionKey)
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    const nodes = Object.values(refs.current).filter(Boolean) as Element[]
    nodes.forEach(n => observer.observe(n))
    return () => observer.disconnect()
  }, [])

  // jump to first invalid field when submitting
  const handleSubmitWithScroll = handleSubmit(onSubmit, () => {
    const first = Object.keys(formState.errors)[0]
    if (first) {
      setErrorToast('Please fix the highlighted fields.')
      setTimeout(() => setErrorToast(null), 2500)

      const mapping: Record<string, SectionKey> = {
        fullName: 'demographics', email: 'demographics', address: 'demographics', phone: 'demographics',
        eligibility: 'eligibility', academic: 'academic', essay: 'essay', acceptedTerms: 'terms'
      }
      const targetKey = mapping[first] || 'demographics'
      const el = refs.current[targetKey]
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })

  const goTo = useCallback((key: SectionKey) => {
    refs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <FormProvider {...methods}>
      {/* Hero / progress */}
      <section className="relative mb-6 overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-xl">
        {/* soft blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              New Application
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Let’s get you funded 🎓</h1>
            <p className="text-sm text-white/90">Complete each section below — you can save a local draft anytime.</p>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-3">
            <ProgressRing percent={pct} />
            <div className="text-xs text-white/90">
              <div className="font-medium">Overall progress</div>
              <div className="opacity-90" aria-live="polite">{pct}% complete</div>
            </div>
          </div>
        </div>

        {/* Section nav (chips) */}
        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          {SECTIONS.map((s, i) => {
            const isActive = active === s.key
            const done = checklist.find(c => c.key === s.key || (s.key === 'activities' && c.key === 'documents'))?.done
            return (
              <button
                key={s.key}
                onClick={() => goTo(s.key)}
                type="button"
                aria-pressed={isActive}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${isActive ? 'bg-white text-indigo-700 shadow' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
              >
                <span className="opacity-80 mr-1">{i + 1}.</span>
                <span className="mr-1">{s.icon}</span>
                {s.label}
                {done ? <span className={`${isActive ? 'text-emerald-600' : 'text-emerald-300'} ml-1`}>✓</span> : null}
              </button>
            )
          })}
        </div>
      </section>

      {/* Layout */}
      <form onSubmit={handleSubmitWithScroll} className="grid gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-8">
          <CardSection id="demographics" title="Applicant Demographics" refsObj={refs}>
            <ApplicantDemographicsSection />
          </CardSection>

          <CardSection id="parent" title="Parent / Employee Information" refsObj={refs}>
            <ParentInfoSection />
          </CardSection>

          <CardSection id="eligibility" title="Eligibility Details" refsObj={refs}>
            <EligibilitySection />
          </CardSection>

          <CardSection id="academic" title="Academic Information" refsObj={refs}>
            <AcademicInfoSection />
          </CardSection>

          <CardSection id="documents" title="Documents & OCR (Optional)" refsObj={refs}>
            {/* OCR component should call setValue('hasDocuments', true, { shouldDirty: true }) on success */}
            <OCRSection />
          </CardSection>

          <CardSection id="activities" title="Activities" refsObj={refs}>
            <ActivitiesTable />
          </CardSection>

          <CardSection id="honors" title="Honors & Awards" refsObj={refs}>
            <HonorsTable />
          </CardSection>

          <CardSection id="community" title="Community Service" refsObj={refs}>
            <CommunityServiceTable />
          </CardSection>

          <CardSection id="work" title="Work / Internship" refsObj={refs}>
            <WorkExperienceTable />
          </CardSection>

          <CardSection id="essay" title="Essay" refsObj={refs}>
            <EssaySection />
          </CardSection>

          <CardSection id="terms" title="Terms & Signature" refsObj={refs}>
            <TermsSection />
          </CardSection>
        </div>

        {/* Right column */}
        <aside className="lg:col-span-4">
          <div className="sticky top-20 space-y-6">
            {/* Save / status */}
            <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Save & status</h3>
                <span className={`text-xs ${saving ? 'text-amber-700' : 'text-gray-500'}`}>
                  {saving ? 'Saving…' : lastSaved ? `Saved ${timeAgo(lastSaved)}` : 'Not saved yet'}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Your draft is stored in your browser. Submitting will finalize this application.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Save draft
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                >
                  Submit
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Checklist</h3>
              <ul className="mt-3 space-y-2">
                {[
                  { label: 'Applicant Demographics', ok: checklist[0].done },
                  { label: 'Eligibility', ok: checklist[1].done },
                  { label: 'Academic Info', ok: checklist[2].done },
                  { label: 'Essay (100+ chars)', ok: checklist[3].done },
                  { label: 'Activities & Documents', ok: checklist[4].done },
                  { label: 'Terms & Signature', ok: checklist[5].done },
                ].map((c, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${c.ok ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className={c.ok ? 'text-gray-800' : 'text-gray-500'}>{c.label}</span>
                    </span>
                    {c.ok ? <span className="text-emerald-600">✓</span> : <span className="text-gray-400">—</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-6 shadow-sm ring-1 ring-indigo-100">
              <h3 className="font-semibold text-gray-900">Tips</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>Upload transcripts with your name, coursework, final grades, and cumulative GPA.</li>
                <li>Use the essay to showcase impact and leadership.</li>
                <li>You can return to this draft any time before the deadline.</li>
              </ul>
            </div>
          </div>
        </aside>
      </form>

      {/* Error toast */}
      {errorToast && (
        <div
          role="status"
          className="fixed left-1/2 top-5 z-[60] -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow-lg"
        >
          {errorToast}
        </div>
      )}

      {/* Sticky footer actions */}
      <div className="sticky bottom-4 z-40 mt-8">
        <div className="mx-auto max-w-7xl rounded-2xl border bg-white/90 p-3 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-gray-600 sm:inline">Progress</span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 transition-all"
                  style={{ width: `${pct}%` }}
                  aria-label="Overall progress bar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>
              <span className="text-gray-700">{pct}%</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void saveDraft()}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Save draft
              </button>
              <button
                onClick={handleSubmitWithScroll}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-105"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}

/* --------- helpers & small components ---------- */
function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return `${days}d ago`
}

function CardSection({
  id, title, refsObj, children
}: {
  id: SectionKey
  title: string
  refsObj: React.MutableRefObject<Record<SectionKey, HTMLDivElement | null>>
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      ref={el => (refsObj.current[id] = el)}
      className="relative rounded-2xl border bg-white shadow-sm"
    >
      {/* gradient rail */}
      <span className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500" />
      <header className="sticky top-14 z-10 flex items-center justify-between gap-3 border-b bg-white/85 px-6 py-3 backdrop-blur">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <a href="#top" className="text-xs text-indigo-600 hover:underline">Back to top</a>
      </header>
      <div className="p-6">
        {children}
      </div>
    </section>
  )
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 64
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(100, percent)) / 100 * c

  return (
    <svg width={size} height={size} className="shrink-0" aria-label="Progress ring">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="url(#grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A5B4FC" /> {/* indigo-300 */}
          <stop offset="100%" stopColor="#F0ABFC" /> {/* fuchsia-300 */}
        </linearGradient>
      </defs>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="600">
        {percent}%
      </text>
    </svg>
  )
}
