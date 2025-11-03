// features/auth/auth.context.tsx
'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Role } from './types'
import { hashPassword } from '@/lib/crypto'

type Ctx = {
  user: User | null
  signIn: (email: string, password?: string) => Promise<boolean>
  signOut: () => void
}

const AuthCtx = createContext<Ctx>({
  user: null,
  signIn: async () => false,
  signOut: () => { },
})

/** Demo emails (password for all: Test@1234) */
const DEMO_EMAILS: Record<Role, string> = {
  applicant: 'applicant@demo.com',
  clientAdmin: 'admin@demo.com',
  coordinator: 'coordinator@demo.com',
  evaluator: 'evaluator@demo.com',
  support: 'support@demo.com',
  systemAdmin: 'sysadmin@demo.com',
}

/** Where each role should land post-login */
const ROLE_HOME: Record<Role, string> = {
  applicant: '/dashboard',       // or '/applications'
  clientAdmin: '/admin/reports',         // your org admin area
  coordinator: '/applications',  // tweak as you prefer
  evaluator: '/evaluation',
  support: '/support',
  systemAdmin: '/sysadmin',      // <- important: not /settings
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (u) setUser(JSON.parse(u as string))

    // seed i18n
    const dict = {
      en: {
        common: { loading: 'Loading…' },
        auth: {
          create_account: 'Create account',
          email: 'Email',
          password: 'Password',
          password_hint: 'At least 6 characters (demo only).',
          language: 'Language',
          create: 'Create account',
          by_creating: 'We will send a confirmation email (demo outbox).',
          confirmation_sent: 'Confirmation email sent! Check “outbox” (demo).',
          errors: { email_in_use: 'That email is already in use.' },
          login: 'Login',
          persona: 'Persona',
          continue: 'Continue',
          need_account: 'Need an account?',
          signup: 'Sign up',
        },
        nav: {
          dashboard: 'Dashboard',
          applications: 'Applications',
          evaluation: 'Evaluation',
          support: 'Support',
          apply: 'Apply',
          signout: 'Sign out',
        },
      },
      fr: {
        common: { loading: 'Chargement…' },
        auth: {
          create_account: 'Créer un compte',
          email: 'E-mail',
          password: 'Mot de passe',
          password_hint: 'Au moins 6 caractères (démo).',
          language: 'Langue',
          create: 'Créer le compte',
          by_creating: 'Nous enverrons un e-mail de confirmation (boîte de sortie démo).',
          confirmation_sent: 'E-mail de confirmation envoyé !',
          errors: { email_in_use: 'Cet e-mail est déjà utilisé.' },
          login: 'Connexion',
          persona: 'Persona',
          continue: 'Continuer',
          need_account: 'Besoin d’un compte ?',
          signup: 'S’inscrire',
        },
        nav: {
          dashboard: 'Tableau de bord',
          applications: 'Candidatures',
          evaluation: 'Évaluation',
          support: 'Assistance',
          apply: 'Postuler',
          signout: 'Déconnexion',
        },
      },
      es: {
        common: { loading: 'Cargando…' },
        auth: {
          create_account: 'Crear cuenta',
          email: 'Correo',
          password: 'Contraseña',
          password_hint: 'Mínimo 6 caracteres (demo).',
          language: 'Idioma',
          create: 'Crear cuenta',
          by_creating: 'Enviaremos un correo de confirmación (bandeja de salida demo).',
          confirmation_sent: '¡Correo de confirmación enviado!',
          errors: { email_in_use: 'Ese correo ya existe.' },
          login: 'Acceder',
          persona: 'Rol',
          continue: 'Continuar',
          need_account: '¿Necesitas una cuenta?',
          signup: 'Regístrate',
        },
        nav: {
          dashboard: 'Panel',
          applications: 'Solicitudes',
          evaluation: 'Evaluación',
          support: 'Soporte',
          apply: 'Aplicar',
          signout: 'Salir',
        },
      },
    }
    localStorage.setItem('__i18n', JSON.stringify(dict))

      // seed demo users
      ; (async () => {
        const users: any[] = JSON.parse(localStorage.getItem('users') || '[]')
        const pwHash = await hashPassword('Test@1234')

          ; (Object.keys(DEMO_EMAILS) as (keyof typeof DEMO_EMAILS)[]).forEach((roleKey) => {
            const role = roleKey as Role
            const email = DEMO_EMAILS[role]
            const idx = users.findIndex((u) => u.email?.toLowerCase() === email.toLowerCase())

            if (idx === -1) {
              users.push({ id: crypto.randomUUID(), email, role, verified: true, passwordHash: pwHash })
            } else {
              users[idx] = { ...users[idx], role, verified: true, passwordHash: pwHash }
            }
          })

        localStorage.setItem('users', JSON.stringify(users))
        localStorage.setItem('demoEmails', JSON.stringify(DEMO_EMAILS))
        // eslint-disable-next-line no-console
        console.info('Demo users ready (password for all: Test@1234)', DEMO_EMAILS)
      })()
  }, [])

  const signIn = async (email: string, password?: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const found = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    if (!found) return false

    if (!found.verified) {
      alert('Please verify your email (use the link saved in outbox).')
      return false
    }

    if (password) {
      const ok = (await hashPassword(password)) === found.passwordHash
      if (!ok) {
        alert('Incorrect password. Use: Test@1234')
        return false
      }
    } else {
      alert('Please enter the demo password: Test@1234')
      return false
    }

    const session: User = {
      id: found.id,
      email: found.email,
      name: 'Demo User',
      role: found.role as Role,
    }
    localStorage.setItem('user', JSON.stringify(session))
    setUser(session)

    // 🚦 role-aware redirect
    const home = ROLE_HOME[session.role] ?? '/dashboard'
    // Using replace to avoid going "back" to the login screen
    router.replace(home)

    return true
  }

  const signOut = () => {
    localStorage.removeItem('user')
    setUser(null)
    // optional: take them back to the public landing/login
    // router.replace('/login')
  }

  return <AuthCtx.Provider value={{ user, signIn, signOut }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
