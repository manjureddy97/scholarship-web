'use client'

import { useState, useCallback, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import Tesseract from 'tesseract.js'

// -------- pdf.js lazy loader (browser only) --------
type PDFJSLib = typeof import('pdfjs-dist/build/pdf')

let pdfjsPromise: Promise<PDFJSLib> | null = null
async function getPdfjs(): Promise<PDFJSLib> {
    if (typeof window === 'undefined') throw new Error('pdf.js only runs in browser')

    if (!pdfjsPromise) {
        pdfjsPromise = (async () => {
            // Use the non-legacy build; it ships everywhere.
            const pdfjs = await import('pdfjs-dist/build/pdf')

            // ✅ Point to a static file in /public to avoid bundler resolving module paths.
            // Prefer the .mjs file you copied; fallback to .js; final fallback = CDN.
            const g = (pdfjs as any).GlobalWorkerOptions
            if (!g.workerSrc && !g.workerPort) {
                if (await urlExists('/pdf.worker.min.mjs')) {
                    g.workerSrc = '/pdf.worker.min.mjs'
                } else if (await urlExists('/pdf.worker.min.js')) {
                    g.workerSrc = '/pdf.worker.min.js'
                } else {
                    // last resort: CDN (version pinned to a recent stable)
                    g.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.js'
                }
            }
            return pdfjs
        })()
    }
    return pdfjsPromise
}

async function urlExists(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
        return res.ok
    } catch {
        return false
    }
}

// ----------------- OCR helpers -----------------
type AcademicPayload = {
    institution?: string
    degree?: string
    major?: string
    state?: string
    gpa?: number
    gradDate?: string
}

function parseAcademicFields(text: string): AcademicPayload {
    const clean = text.replace(/\s+/g, ' ').trim()

    const instMatch = clean
        .match(/\b(?:University|College|Institute|School|Academy)\b.*?(?=(Degree|Major|GPA|Graduation|State|$))/i)?.[0]
    const institution = instMatch?.replace(/(Degree|Major|GPA|Graduation|State).*$/i, '')?.trim()

    const degree = clean
        .match(/\b((B\.?S\.?|BSc|Bachelor(?:'s)?(?: of [A-Za-z& ]+)?)|(M\.?S\.?|MSc|Master(?:'s)?(?: of [A-Za-z& ]+)?))\b/i)?.[0]

    const major = clean
        .match(/\b(Major|Program|Field)\s*[:\-]\s*([A-Za-z &/]+?)(?=(,|;|GPA|Grad|State|$))/i)?.[2]?.trim()

    const state = clean
        .match(/\b(State|Province)\s*[:\-]\s*([A-Za-z .]+?)(?=(,|;|GPA|Grad|Graduation|$))/i)?.[2]?.trim()

    const gpaStr = clean.match(/\bGPA\s*[:\-]?\s*([0-5](?:\.\d{1,2})?)\b/i)?.[1]
    const gpa = gpaStr ? Number(gpaStr) : undefined

    const gradDate =
        clean.match(/\b((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i)?.[1] ||
        clean.match(/\b(\d{1,2}[\/\-]\d{4})\b/)?.[1]

    const out: AcademicPayload = {}
    if (institution) out.institution = institution
    if (degree) out.degree = degree
    if (major) out.major = major
    if (state) out.state = state
    if (gpa !== undefined && gpa >= 0 && gpa <= 5) out.gpa = gpa
    if (gradDate) out.gradDate = gradDate
    return out
}

async function runTesseractOnBlob(blob: Blob): Promise<string> {
    const { data } = await Tesseract.recognize(blob, 'eng', {
        tessedit_char_whitelist:
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,:/()&% ',
    })
    return data.text || ''
}

// ----------------- main component -----------------
export function OCRSection() {
    const { setValue } = useFormContext()
    const [inputName, setInputName] = useState<string>('')
    const [busy, setBusy] = useState(false)
    const [rawText, setRawText] = useState<string>('')
    const [parsed, setParsed] = useState<AcademicPayload>({})
    const [error, setError] = useState<string | null>(null)

    // Cache of rendered PDF page blobs to avoid re-render on same file
    const pdfBlobCache = useRef<Map<string, Blob[]>>(new Map())

    const pdfToPngBlobs = useCallback(async (file: File): Promise<Blob[]> => {
        const cacheKey = `${file.name}:${file.size}:${file.lastModified}`
        const cached = pdfBlobCache.current.get(cacheKey)
        if (cached) return cached

        const pdfjs = await getPdfjs()
        const arrayBuf = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: arrayBuf }).promise
        const blobs: Blob[] = []

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale: 2 }) // 2x for better OCR
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = viewport.width
            canvas.height = viewport.height
            const renderTask = page.render({ canvasContext: ctx!, viewport })
            await renderTask.promise
            const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'))
            blobs.push(blob)
        }

        pdfBlobCache.current.set(cacheKey, blobs)
        return blobs
    }, [])

    const handleFile = useCallback(async (file: File) => {
        setBusy(true)
        setError(null)
        setRawText('')
        setParsed({})
        try {
            let blobs: Blob[] = []
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                blobs = await pdfToPngBlobs(file)
            } else {
                blobs = [file]
            }

            const texts: string[] = []
            for (const blob of blobs) {
                const t = await runTesseractOnBlob(blob)
                if (t?.trim()) texts.push(t)
            }

            const text = texts.join('\n\n').trim()
            setRawText(text)

            const payload = parseAcademicFields(text)
            setParsed(payload)
        } catch (e: any) {
            console.error(e)
            setError('Failed to process file. Try a clear scan/photo or a smaller PDF.')
        } finally {
            setBusy(false)
        }
    }, [pdfToPngBlobs])

    const applyToForm = () => {
        if (parsed.institution) setValue('academic.institution', parsed.institution, { shouldDirty: true })
        if (parsed.degree) setValue('academic.degree', parsed.degree, { shouldDirty: true })
        if (parsed.major) setValue('academic.major', parsed.major, { shouldDirty: true })
        if (parsed.state) setValue('academic.state', parsed.state, { shouldDirty: true })
        if (parsed.gpa !== undefined) setValue('academic.gpa', parsed.gpa, { shouldDirty: true })
        if (parsed.gradDate) setValue('academic.gradDate', parsed.gradDate, { shouldDirty: true })

        // ✅ tell main form that a document was processed
        setValue('hasDocuments', true, { shouldDirty: true })
    }

    return (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-800">Transcript OCR (Optional)</h3>
                {busy ? <span className="text-xs text-amber-700">Processing…</span> : null}
            </div>

            <p className="mt-2 text-sm text-gray-600">
                Upload a transcript (PDF/JPG/PNG). We’ll extract text locally and attempt to fill Academic fields.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
                    <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) {
                                setInputName(f.name)
                                void handleFile(f)
                            }
                        }}
                    />
                    Choose file
                </label>
                <span className="truncate text-xs text-gray-500">{inputName || 'No file selected'}</span>
                <div className="flex-1" />
                <button
                    type="button"
                    onClick={applyToForm}
                    disabled={!parsed || Object.keys(parsed).length === 0}
                    className={`rounded-xl px-3 py-2 text-sm text-white shadow-sm ${(!parsed || Object.keys(parsed).length === 0)
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:brightness-105'
                        }`}
                >
                    Apply to form
                </button>
            </div>

            {error && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {error}
                </div>
            )}

            {parsed && Object.keys(parsed).length > 0 && (
                <div className="mt-5 rounded-xl border bg-gray-50 p-4 text-sm">
                    <div className="font-medium text-gray-800">Detected fields</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Field label="Institution" value={parsed.institution} />
                        <Field label="Degree" value={parsed.degree} />
                        <Field label="Major" value={parsed.major} />
                        <Field label="State" value={parsed.state} />
                        <Field label="GPA" value={parsed.gpa?.toString()} />
                        <Field label="Graduation" value={parsed.gradDate} />
                    </div>
                </div>
            )}

            {rawText && (
                <details className="mt-4 rounded-xl border bg-white p-4 text-sm open:shadow-sm">
                    <summary className="cursor-pointer select-none text-gray-800">Show extracted text</summary>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700">
                        {rawText}
                    </pre>
                </details>
            )}
        </div>
    )
}

function Field({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-lg border bg-white px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
            <div className="text-gray-800">{value || <span className="text-gray-400">—</span>}</div>
        </div>
    )
}
