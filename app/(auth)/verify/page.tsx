'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Optional: if static export keeps pre-rendering this page, leave this:
export const dynamic = 'force-dynamic'

function VerifyInner() {
    const q = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'checking' | 'ok' | 'fail'>('checking')

    useEffect(() => {
        // runs only in the browser
        try {
            const token = q.get('token')
            const users = JSON.parse(window.localStorage.getItem('users') || '[]')
            const idx = users.findIndex((u: any) => u.token === token)

            if (token && idx >= 0) {
                users[idx].verified = true
                delete users[idx].token
                window.localStorage.setItem('users', JSON.stringify(users))
                setStatus('ok')
                const t = setTimeout(() => router.push('/login'), 1200)
                return () => clearTimeout(t)
            } else {
                setStatus('fail')
            }
        } catch {
            setStatus('fail')
        }
    }, [q, router])

    return (
        <div className="mx-auto max-w-md card">
            {status === 'checking' && <p>Verifying…</p>}
            {status === 'ok' && <p className="text-green-700">Email verified! Redirecting to login…</p>}
            {status === 'fail' && <p className="text-red-700">Invalid or expired link.</p>}
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-md card">Verifying…</div>}>
            <VerifyInner />
        </Suspense>
    )
}
