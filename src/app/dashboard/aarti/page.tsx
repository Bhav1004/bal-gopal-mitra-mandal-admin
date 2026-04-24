'use client'
import { useEffect, useState } from 'react'
import { getAartis, addAarti, updateAarti, deleteAarti, type Aarti } from '@/lib/firestore'
import toast from 'react-hot-toast'

const emptyAarti = (): Omit<Aarti, 'id'> => ({ name: '', lyrics: '', order: 99, isActive: true })

export default function AartiPage() {
  const [aartis, setAartis]       = useState<Aarti[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Aarti | null>(null)
  const [form, setForm]           = useState<Omit<Aarti, 'id'>>(emptyAarti())
  const [saving, setSaving]       = useState(false)

  const load = async () => {
    setLoading(true)
    try { setAartis(await getAartis()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyAarti(), order: aartis.length + 1 })
    setShowModal(true)
  }
  const openEdit = (a: Aarti) => { setEditing(a); setForm({ name: a.name, lyrics: a.lyrics, order: a.order, isActive: a.isActive }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.name.trim() || !form.lyrics.trim()) { toast.error('Name and lyrics are required'); return }
    setSaving(true)
    try {
      if (editing?.id) { await updateAarti(editing.id, form); toast.success('Aarti updated') }
      else { await addAarti(form); toast.success('Aarti added') }
      setShowModal(false); await load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this aarti?')) return
    await deleteAarti(id); toast.success('Deleted'); await load()
  }

  const toggleActive = async (a: Aarti) => {
    if (!a.id) return
    await updateAarti(a.id, { isActive: !a.isActive })
    toast.success(a.isActive ? 'Hidden from app' : 'Visible in app')
    await load()
  }

  const moveOrder = async (a: Aarti, dir: -1 | 1) => {
    if (!a.id) return
    await updateAarti(a.id, { order: a.order + dir })
    await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aarti</h2>
          <p className="text-sm text-gray-500">Manage Marathi aarti lyrics</p>
        </div>
        <button onClick={openNew} className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Aarti
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
        💡 <strong>Tip:</strong> Compose Devanagari lyrics in Google Docs with a Marathi keyboard, then paste here.
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl border h-16 animate-pulse"/>)}</div>
      ) : aartis.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          No aartis yet.
        </div>
      ) : (
        <div className="space-y-2">
          {aartis.map(a => (
            <div key={a.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${!a.isActive ? 'opacity-50' : 'border-gray-200'}`}>
              {/* Order controls */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveOrder(a, -1)} className="text-gray-400 hover:text-gray-700 text-xs leading-none">▲</button>
                <span className="text-xs text-gray-400 text-center">{a.order}</span>
                <button onClick={() => moveOrder(a, 1)} className="text-gray-400 hover:text-gray-700 text-xs leading-none">▼</button>
              </div>
              <div className="text-xl">🙏</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{a.lyrics.split('\n')[0]}</p>
              </div>
              <div className="flex gap-2 items-center shrink-0">
                <button onClick={() => toggleActive(a)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${a.isActive ? 'border-green-300 text-green-700 bg-green-50' : 'border-gray-200 text-gray-500'}`}>
                  {a.isActive ? 'Visible' : 'Hidden'}
                </button>
                <button onClick={() => openEdit(a)} className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleDelete(a.id!)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Aarti' : 'Add Aarti'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aarti Name (Devanagari) *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="सुखकर्ता दुखहर्ता"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: +e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-orange-600"/>
                    Active (visible in app)
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lyrics (Devanagari) *</label>
                <p className="text-xs text-gray-400 mb-2">Paste Marathi text directly. Use Enter for new lines/verses.</p>
                <textarea value={form.lyrics} onChange={e => setForm(f => ({ ...f, lyrics: e.target.value }))}
                  rows={12}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y font-sans"
                  placeholder="सुखकर्ता दुखहर्ता वार्ता विघ्नाची ।&#10;नुरवी पुरवी प्रेम कृपा जयाची ।"/>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold rounded-lg">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Aarti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
