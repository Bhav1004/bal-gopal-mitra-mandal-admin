'use client'
import { useEffect, useState } from 'react'
import { getUpdates, addUpdate, updateUpdate, deleteUpdate, type Update, type Tag } from '@/lib/firestore'
import toast from 'react-hot-toast'

const TAGS: Tag[] = ['puja', 'event', 'notice', 'traffic', 'emergency']
const TAG_COLORS: Record<Tag, string> = {
  puja:      'bg-orange-100 text-orange-800',
  event:     'bg-green-100  text-green-800',
  notice:    'bg-blue-100   text-blue-800',
  traffic:   'bg-yellow-100 text-yellow-800',
  emergency: 'bg-red-100    text-red-800',
}

const empty: Omit<Update, 'id'> = { title: '', body: '', tag: 'notice', isPinned: false, timestamp: 0 }

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Update | null>(null)
  const [form, setForm]           = useState<Omit<Update, 'id'>>(empty)
  const [saving, setSaving]       = useState(false)

  const load = async () => {
    setLoading(true)
    try { setUpdates(await getUpdates()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(empty)
    setShowModal(true)
  }

  const openEdit = (u: Update) => {
    setEditing(u)
    setForm({ title: u.title, body: u.body, tag: u.tag, isPinned: u.isPinned, timestamp: u.timestamp, imageUrl: u.imageUrl })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required'); return
    }
    setSaving(true)
    try {
      if (editing?.id) {
        await updateUpdate(editing.id, form)
        toast.success('Update saved')
      } else {
        await addUpdate({ ...form, timestamp: Date.now() })
        toast.success('Update posted!')
      }
      setShowModal(false)
      await load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this update?')) return
    await deleteUpdate(id)
    toast.success('Deleted')
    await load()
  }

  const handlePin = async (u: Update) => {
    if (!u.id) return
    await updateUpdate(u.id, { isPinned: !u.isPinned })
    await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Updates</h2>
          <p className="text-sm text-gray-500">Manage mandal announcements</p>
        </div>
        <button onClick={openNew}
          className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + New Update
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl border h-24 animate-pulse"/>)}
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          No updates yet. Create the first one!
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map(u => (
            <div key={u.id}
              className={`bg-white rounded-xl border p-4 flex gap-4 items-start ${u.isPinned ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {u.isPinned && <span className="text-xs font-bold text-orange-600">📌 Pinned</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[u.tag]}`}>
                    {u.tag.charAt(0).toUpperCase() + u.tag.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(u.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{u.title}</h3>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{u.body}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handlePin(u)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${u.isPinned ? 'border-orange-400 text-orange-600' : 'border-gray-200 text-gray-500 hover:border-orange-300'}`}>
                  {u.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => openEdit(u)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Edit
                </button>
                <button onClick={() => handleDelete(u.id!)}
                  className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Update' : 'New Update'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. Aarti timing update"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  placeholder="Full announcement text…"/>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                  <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value as Tag }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.isPinned}
                      onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                      className="w-4 h-4 accent-orange-600"/>
                    Pin to top
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold rounded-lg">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Post Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
