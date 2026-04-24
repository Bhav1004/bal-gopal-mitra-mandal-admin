'use client'
import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/lib/firestore'

interface Stats {
  updates: number
  aartis: number
  feedback: number
  unreadFeedback: number
  registeredDevices: number
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-orange-600 mt-1 font-medium">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError('Could not load stats — check Firebase connection.'))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Ganeshotsav 2026 · Overview</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          ⚠ {error}
        </div>
      )}

      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard icon="📢" label="Total Updates"        value={stats.updates}           />
          <StatCard icon="🙏" label="Aartis"               value={stats.aartis}            />
          <StatCard
            icon="💬" label="Feedback Received"
            value={stats.feedback}
            sub={stats.unreadFeedback > 0 ? `${stats.unreadFeedback} unread` : undefined}
          />
          <StatCard icon="📱" label="Registered Devices"   value={stats.registeredDevices} />
        </div>
      ) : !error ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-28"/>
          ))}
        </div>
      ) : null}

      {/* Quick links */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/updates',  label: 'Post Update',      icon: '✏️' },
            { href: '/dashboard/schedule', label: 'Edit Schedule',    icon: '📅' },
            { href: '/dashboard/aarti',    label: 'Manage Aartis',    icon: '🙏' },
            { href: '/dashboard/feedback', label: 'View Feedback',    icon: '💬' },
          ].map(({ href, label, icon }) => (
            <a
              key={href} href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100
                         hover:border-orange-200 hover:bg-orange-50 transition-colors text-center"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
