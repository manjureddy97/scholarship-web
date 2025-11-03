// components/layout/AppHeader.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth/auth.context'
import type { Role } from '@/features/auth/types'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import { useI18n } from '@/lib/i18n/lang.context'

const ROLE_LABEL: Record<Role, string> = {
  applicant: 'Applicant',
  clientAdmin: 'Client Admin',
  coordinator: 'Coordinator',
  evaluator: 'Evaluator',
  support: 'Support',
  systemAdmin: 'System Admin',
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active =
    pathname === href ||
    (href !== '/' && pathname?.startsWith(href)) // highlight for nested routes like /admin/reports/...
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm transition hover:bg-gray-100 ${active ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700'
        }`}
    >
      {children}
    </Link>
  )
}

function Avatar({ email }: { email: string }) {
  const initials = (email?.[0] ?? 'U').toUpperCase()
  return (
    <div
      title={email}
      className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand font-semibold"
    >
      {initials}
    </div>
  )
}

export default function AppHeader() {
  const { user, signOut } = useAuth()
  const { t } = useI18n()

  const roleLinks = (role: Role) => {
    switch (role) {
      case 'applicant':
        return (
          <>
            <NavLink href="/dashboard">{t('nav.dashboard')}</NavLink>
            <NavLink href="/applications/new">{t('nav.apply')}</NavLink>
          </>
        )
      case 'evaluator':
        return <NavLink href="/evaluation">Evaluation</NavLink>
      case 'coordinator':
        // Coordinators generally supervise reviews + high-level reporting
        return (
          <>
            <NavLink href="/evaluation">Evaluation</NavLink>
            <NavLink href="/admin/reports">Reports</NavLink>
          </>
        )
      case 'clientAdmin':
        return (
          <>
            <NavLink href="/admin/reports">Reports</NavLink>
            <NavLink href="/admin/settings">Settings</NavLink>
          </>
        )
      case 'support':
        return <NavLink href="/support">Support Console</NavLink>
      case 'systemAdmin':
        return <NavLink href="/admin/settings">System Settings</NavLink>
      default:
        return null
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold group">
          <span className="rounded bg-brand/10 px-2 py-1 text-brand text-xs">ISTS</span>
          <span className="text-brand group-hover:underline underline-offset-4">Scholarship Portal</span>
        </Link>

        {/* Right */}
        <nav className="flex items-center gap-2">
          <NavLink href="/support">{t('nav.support')}</NavLink>
          <LanguageSwitcher />

          {user ? (
            <>
              <span className="hidden sm:inline rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                {ROLE_LABEL[user.role]}
              </span>
              {roleLinks(user.role)}
              <div className="mx-1 h-6 w-px bg-gray-200" />
              <Avatar email={user.email} />
              <button
                onClick={signOut}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                {t('nav.signout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-brand px-3 py-1.5 text-sm text-white shadow-soft"
              >
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
    </header>
  )
}
