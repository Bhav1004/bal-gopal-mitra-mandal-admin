'use client'
import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login, user }         = useAuth()
  const router                  = useRouter()

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.replace('/dashboard')
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.message
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🙏</div>
          <h1 className="text-2xl font-bold text-gray-900">Bal Gopal Mitra Mandal</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel · Sign In</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="admin@mandal.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60
                       text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Admin access only · Ganeshotsav 2026
        </p>
      </div>
    </div>
  )
}
