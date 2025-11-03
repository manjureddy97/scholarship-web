'use client'
import { useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/safe-storage'

export function usePersistentState(key: string, initial: string = '') {
    const [value, setValue] = useState(initial)

    // Load on mount (browser only)
    useEffect(() => {
        const v = safeLocalStorage.get(key)
        if (v != null) setValue(v)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    // Save on change
    useEffect(() => {
        safeLocalStorage.set(key, value)
    }, [key, value])

    return [value, setValue] as const
}
