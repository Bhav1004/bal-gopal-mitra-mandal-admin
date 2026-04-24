'use client'
import { useEffect, useState } from 'react'
import { getFeedback, markFeedbackRead, type Feedback } from '@/lib/firestore'
import toast from 'react-hot-toast'

function Stars({ n }: { n: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

export default function FeedbackPage() {
  const [items, setItems]     = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'unread'>('all')

  const load = async () => {
    setLoading(true)
    try { setItems(await getFeedback()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleMarkRead = async (id: string) => {
    await markFeedbackRead(id)
    toast.success('Marked as read')
    await load()
  }

  const visible = filter === 'unread' ? items.filter(i => !i.isRead) : items
  const unreadCount = items.filter(i => !i.isRead).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback</h2>
          <p className="text-sm text-gray-500">Resident submissions — read only</p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${filter === f ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'all' ? `All (${items.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl border h-24 animate-pulse"/>)}</div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          {filter === 'unread' ? 'All caught up! No unread feedback.' : 'No feedback yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(fb => (
            <div key={fb.id}
              className={`bg-white rounded-xl border p-4 ${!fb.isRead ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">
                      {fb.isAnonymous ? '🕵️ Anonymous' : `👤 ${fb.name}`}
                    </span>
                    {!fb.isAnonymous && fb.phone && (
                      <span className="text-xs text-gray-500">📱 {fb.phone}</span>
                    )}
                    {fb.rating > 0 && <Stars n={fb.rating} />}
                    <span className="text-xs text-gray-400">
                      {new Date(fb.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!fb.isRead && <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full font-bold">NEW</span>}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{fb.feedback}</p>
                </div>
                {!fb.isRead && (
                  <button onClick={() => handleMarkRead(fb.id!)}
                    className="text-xs text-orange-600 border border-orange-300 hover:bg-orange-50 px-2 py-1 rounded shrink-0">
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
