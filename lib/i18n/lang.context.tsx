'use client'
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

type Lang = 'en' | 'fr' | 'es'
type Dict = Record<string, any>

const defaultDict: Record<Lang, Dict> = {
    en: { nav: { support: 'Support', dashboard: 'Dashboard', apply: 'Apply', signout: 'Sign out' } },
    fr: { nav: { support: 'Assistance', dashboard: 'Tableau de bord', apply: 'Postuler', signout: 'Déconnexion' } },
    es: { nav: { support: 'Soporte', dashboard: 'Panel', apply: 'Aplicar', signout: 'Salir' } }
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }
const I18nCtx = createContext<Ctx>({ lang: 'en', setLang: () => { }, t: (k) => k })

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>('en')
    const [dict, setDict] = useState<Record<Lang, Dict>>(defaultDict)

    useEffect(() => {
        const saved = (localStorage.getItem('lang') as Lang) || 'en'
        setLangState(saved)
        // merge in any existing dictionaries seeded elsewhere
        const seeded = localStorage.getItem('__i18n')
        if (seeded) {
            const merged = { ...defaultDict, ...(JSON.parse(seeded) as any) }
            setDict(merged)
        }
    }, [])

    const setLang = (l: Lang) => {
        setLangState(l)
        localStorage.setItem('lang', l)
    }

    const t = (key: string) =>
        key.split('.').reduce((a: any, p) => (a ? a[p] : undefined), dict[lang]) ?? key

    const value = useMemo(() => ({ lang, setLang, t }), [lang, dict])
    return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export const useI18n = () => useContext(I18nCtx)
