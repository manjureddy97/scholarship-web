import './globals.css'
import { ReactNode } from 'react'
import AppHeader from '@/components/layout/AppHeader'
import { AuthProvider } from '@/features/auth/auth.context'
import { LanguageProvider } from '@/lib/i18n/lang.context'

export const metadata = {
  title: 'Scholarship Application System',
  description: 'ISTS-style scholarship lifecycle management (dummy data)'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>      {/* <-- add */}
          <AuthProvider>
            <AppHeader />
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          </AuthProvider>
        </LanguageProvider>      {/* <-- add */}
      </body>
    </html>
  )
}
