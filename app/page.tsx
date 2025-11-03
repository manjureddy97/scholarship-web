'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Home() {
  const [stats, setStats] = useState({ applications: 0, scholarships: 0, users: 0 })
  useEffect(() => {
    // Fake counter animation
    const interval = setInterval(() => {
      setStats(prev => ({
        applications: Math.min(prev.applications + 12, 1240),
        scholarships: Math.min(prev.scholarships + 3, 48),
        users: Math.min(prev.users + 20, 3200),
      }))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      title: 'Application & Renewal Portal',
      desc: 'Apply, renew, and track scholarships in one place.',
      icon: '🎓',
      color: 'from-blue-500/20 to-blue-200/20',
    },
    {
      title: 'Document Upload & Verification',
      desc: 'Secure file uploads, transcript checks, and GPA validation.',
      icon: '📄',
      color: 'from-emerald-500/20 to-emerald-200/20',
    },
    {
      title: 'Selection & Evaluation',
      desc: 'Automated scoring with custom rubrics and evaluator dashboards.',
      icon: '⭐',
      color: 'from-amber-500/20 to-yellow-200/20',
    },
    {
      title: 'Reports & Analytics',
      desc: 'Real-time program insights with charts and exportable reports.',
      icon: '📊',
      color: 'from-indigo-500/20 to-indigo-200/20',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 -z-10" />

      <section className="mx-auto max-w-7xl px-6 py-20 grid gap-12 md:grid-cols-2 items-center">
        {/* Left: Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Empowering Students with Smarter Scholarships
          </h1>
          <p className="text-lg text-gray-600 max-w-lg">
            A modern platform to apply, renew, and manage scholarships effortlessly.
            Built for speed, accessibility, and data transparency.
          </p>

          <div className="flex gap-4 pt-2">
            <Link href="/login" className="rounded-lg bg-brand text-white px-5 py-3 font-medium shadow-soft hover:bg-blue-700 transition">
              Get Started
            </Link>
            <Link href="/about" className="rounded-lg border px-5 py-3 font-medium hover:bg-gray-50 transition">
              Learn More
            </Link>
          </div>
        </motion.div>

        {/* Right: Stats */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="grid gap-6"
        >
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Applications', value: stats.applications },
              { label: 'Scholarships', value: stats.scholarships },
              { label: 'Active Users', value: stats.users },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-white shadow-sm p-4 text-center border border-gray-100">
                <p className="text-2xl font-semibold text-brand">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl bg-gradient-to-r from-brand/5 to-indigo-100 p-6 text-gray-700 shadow-inner">
            “The new Scholarship Portal reduced manual verification time by <span className="text-brand font-semibold">70%</span>
            and improved applicant satisfaction across all programs.”
            <div className="mt-2 text-sm text-gray-500">— ISTS Program Insights, 2025</div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Key Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl bg-gradient-to-br ${f.color} p-6 backdrop-blur shadow-sm border border-gray-100 hover:shadow-md transition`}
              >
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 bg-gradient-to-br from-brand/5 via-white to-indigo-50 border-t border-gray-100 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Ready to streamline your scholarship management?
        </h2>
        <Link href="/login" className="rounded-lg bg-brand px-6 py-3 text-white font-medium shadow-soft hover:bg-blue-700 transition">
          Launch Demo Portal
        </Link>
      </section>
    </div>
  )
}
