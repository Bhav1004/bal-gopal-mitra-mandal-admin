'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const nav = [
  { href: '/dashboard',          label: 'Dashboard',  icon: '📊' },
  { href: '/dashboard/updates',  label: 'Updates',    icon: '📢' },
  { href: '/dashboard/schedule', label: 'Schedule',   icon: '📅' },
  { href: '/dashboard/aarti',    label: 'Aarti',      icon: '🙏' },
  { href: '/dashboard/gallery',  label: 'Gallery',    icon: '🖼️' },
  { href: '/dashboard/feedback', label: 'Feedback',   icon: '💬' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    router.replace('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="text-2xl mb-1">🙏</div>
        <h1 className="font-bold text-gray-900 text-sm leading-tight">
          Bal Gopal Mitra Mandal
        </h1>
        <p className="text-xs text-orange-600 font-medium">Admin Panel</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 truncate mb-2">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
