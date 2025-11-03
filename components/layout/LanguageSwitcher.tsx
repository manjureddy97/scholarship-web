'use client'
import { useI18n } from '@/lib/i18n/lang.context'
import { useState } from 'react'

export default function LanguageSwitcher() {
    const { lang, setLang } = useI18n()
    const [open, setOpen] = useState(false)
    const options: Array<{ v: 'en' | 'fr' | 'es'; label: string }> = [
        { v: 'en', label: 'EN' }, { v: 'fr', label: 'FR' }, { v: 'es', label: 'ES' }
    ]
    return (
        <div className="relative">
            <button
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => setOpen(o => !o)}
                aria-label="Language"
            >
                {lang.toUpperCase()}
                <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-60"><path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
            {open && (
                <div
                    className="absolute right-0 z-50 mt-2 w-28 rounded-xl border bg-white p-1 shadow-soft"
                    onMouseLeave={() => setOpen(false)}
                >
                    {options.map(o => (
                        <button
                            key={o.v}
                            onClick={() => { setLang(o.v); setOpen(false) }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${lang === o.v ? 'bg-brand/10 text-brand' : ''}`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
