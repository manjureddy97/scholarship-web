'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { createWorker } from 'tesseract.js'

// -------- pdf.js lazy loader (browser only) --------
type PDFJSLib = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PDFJSLib> | null = null
async function getPdfjs(): Promise<PDFJSLib> {
  if (typeof window === 'undefined') throw new Error('pdf.js only runs in browser')

  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf')
      const g = (pdfjs as any).GlobalWorkerOptions

      if (!g.workerSrc && !g.workerPort) {
        if (await urlExists('/pdf.worker.min.mjs')) {
          g.workerSrc = '/pdf.worker.min.mjs'
        } else if (await urlExists('/pdf.worker.min.js')) {
          g.workerSrc = '/pdf.worker.min.js'
        } else {
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

// 🧠 Regex-based parsing
function parseAcademicFields(text: string): AcademicPayload {
  const clean = text.replace(/\s+/g, ' ').trim()

  const instMatch = clean.match(/\b(?:University|College|Institute|School|Academy)\b.*?(?=(Degree|Major|GPA|Graduation|State|$))/i)?.[0]
  const institution = instMatch?.replace(/(Degree|Major|GPA|Graduation|State).*$/i, '')?.trim()

  const degree = clean.match(/\b((B\.?S\.?|BSc|Bachelor(?:'s)?(?: of [A-Za-z& ]+)?)|(M\.?S\.?|MSc|Master(?:'s)?(?: of [A-Za-z& ]+)?))\b/i)?.[0]
  const major = clean.match(/\b(Major|Program|Field)\s*[:\-]\s*([A-Za-z &/]+?)(?=(,|;|GPA|Grad|State|$))/i)?.[2]?.trim()
  const state = clean.match(/\b(State|Province)\s*[:\-]\s*([A-Za-z .]+?)(?=(,|;|GPA|Grad|Graduation|$))/i)?.[2]?.trim()
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

function parseSSCFields(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();

  const find = (label: string) =>
    clean.match(new RegExp(label + '\\s*[:\\-]?\\s*([A-Za-z0-9 ./,-]+)', 'i'))?.[1]?.trim();

  return {
    studentName: find('CERTIFIED THAT|NAME'),
    fatherName: find("FATHER'S NAME"),
    motherName: find("MOTHER'S NAME"),
    rollNumber: clean.match(/\bRoll ?No\.?\s*[:\-]?\s*(\d{5,12})/i)?.[1],
    dob: clean.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0],
    institution: find('SCHOOL'),
    medium: find('MEDIUM'),
    cgpa: Number(clean.match(/\bCGPA\b[^0-9]*([0-9]\.?[0-9]?)\b/i)?.[1]),
  };
}


// ----------------- Tesseract.js Setup -----------------
let ocrWorker: any = null

// ✅ Stable worker loader with error handling
async function getTesseractWorker() {
  if (!ocrWorker) {
    try {
      // ✅ Tesseract.js v6 API
      ocrWorker = await createWorker('eng', 1, {
        logger: m => console.log(m.status, m.progress), // optional: progress logs
      })
    } catch (err) {
      console.error('Failed to initialize Tesseract worker:', err)
      ocrWorker = null
      throw err
    }
  }
  return ocrWorker
}

// ✅ Safe OCR wrapper
async function runTesseractOnBlob(blob: Blob): Promise<string> {
  try {
    if (!blob || blob.size === 0) throw new Error('Empty blob passed to OCR')
    const worker = await getTesseractWorker()
    const { data } = await worker.recognize(blob, 'eng', {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/- ',
      preserve_interword_spaces: 1,
    })
    console.log(`OCR complete. Confidence: ${data.confidence}%`)
    let text = (data?.text || '').trim()

    // 🧹 Clean noisy OCR output
    text = text
      .replace(/[^\x20-\x7E\n]+/g, ' ') // remove weird symbols
      .replace(/[|_~]/g, ' ')           // remove underline/table artifacts
      .replace(/\s{2,}/g, ' ')          // collapse multiple spaces
      .replace(/\n{2,}/g, '\n')         // collapse blank lines
      .trim()

    if (!text) throw new Error('No text detected')
    return text
  } catch (err) {
    console.error('OCR failed:', err)
    throw err
  }
}

// ----------------- main component -----------------
export function OCRSection() {
  const { setValue } = useFormContext()
  const [inputName, setInputName] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [rawText, setRawText] = useState<string>('')
  const [parsed, setParsed] = useState<AcademicPayload>({})
  const [error, setError] = useState<string | null>(null)
  const pdfBlobCache = useRef<Map<string, Blob[]>>(new Map())

  // 🧹 Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (ocrWorker) {
        ocrWorker.terminate()
        ocrWorker = null
      }
    }
  }, [])

  // ✅ PDF to PNG converter with empty-page protection
  const pdfToPngBlobs = useCallback(async (file: File): Promise<Blob[]> => {
    const cacheKey = `${file.name}:${file.size}:${file.lastModified}`
    const cached = pdfBlobCache.current.get(cacheKey)
    if (cached) return cached

    const pdfjs = await getPdfjs()
    const arrayBuf = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuf }).promise
    const blobs: Blob[] = []

    const scale = window.devicePixelRatio > 1 ? 1.5 : 1
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const renderTask = page.render({
        canvas,
        canvasContext: ctx!,
        viewport,
      })
      await renderTask.promise

      // 🧮 Preprocess image: grayscale + threshold for cleaner OCR
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let j = 0; j < data.length; j += 4) {
        const r = data[j], g = data[j + 1], b = data[j + 2]
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const value = gray > 180 ? 255 : 0 // threshold
        data[j] = data[j + 1] = data[j + 2] = value
      }
      ctx!.putImageData(imageData, 0, 0)

      // ✅ Convert the cleaned canvas to blob
      const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'))

      if (blob && blob.size > 0) blobs.push(blob)
      canvas.width = 0
      canvas.height = 0
    }

    if (!blobs.length) throw new Error('No valid PDF pages rendered.')
    pdfBlobCache.current.set(cacheKey, blobs)
    return blobs
  }, [])

  // ✅ Main handler with extra logging
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

      if (!blobs.length) throw new Error('No blobs to OCR')

      const texts: string[] = []
      for (const blob of blobs) {
        try {
          const t = await runTesseractOnBlob(blob)
          if (t?.trim()) texts.push(t)
        } catch (innerErr) {
          console.warn('Skipping a failed page:', innerErr)
        }
      }

      const text = texts.join('\n\n').trim()
      if (!text) throw new Error('No readable text detected.')

      setRawText(text)
      const payload = {
        ...parseAcademicFields(text), // existing university format parser
        ...parseSSCFields(text), // ⬅ NEW: handles Indian SSC
      };

      setParsed(payload);

    } catch (e: any) {
      console.error('File processing failed:', e)
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
          {busy ? 'Processing…' : 'Choose file'}
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
