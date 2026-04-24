'use client'
import { useEffect, useState } from 'react'
import { getSchedule, addScheduleDay, updateScheduleDay, deleteScheduleDay, type ScheduleDay, type ScheduleEvent } from '@/lib/firestore'
import toast from 'react-hot-toast'

const emptyEvent = (): ScheduleEvent => ({ time: '', name: '', notes: '' })

const emptyDay = (): Omit<ScheduleDay, 'id'> => ({
  dayNumber: 1, date: '', dayName: '', events: [emptyEvent()]
})

export default function SchedulePage() {
  const [days, setDays]         = useState<ScheduleDay[]>([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState<ScheduleDay | null>(null)
  const [form, setForm]         = useState<Omit<ScheduleDay, 'id'>>(emptyDay())
  const [saving, setSaving]     = useState(false)

  const load = async () => {
    setLoading(true)
    try { setDays(await getSchedule()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(emptyDay()); setShowModal(true) }
  const openEdit = (d: ScheduleDay) => {
    setEditing(d)
    setForm({ dayNumber: d.dayNumber, date: d.date, dayName: d.dayName, events: d.events.length ? d.events : [emptyEvent()] })
    setShowModal(true)
  }

  const setEvent = (i: number, key: keyof ScheduleEvent, val: string) =>
    setForm(f => ({ ...f, events: f.events.map((e, idx) => idx === i ? { ...e, [key]: val } : e) }))

  const addEvent  = () => setForm(f => ({ ...f, events: [...f.events, emptyEvent()] }))
  const dropEvent = (i: number) => setForm(f => ({ ...f, events: f.events.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    if (!form.dayName.trim() || !form.date.trim()) { toast.error('Day name and date are required'); return }
    setSaving(true)
    try {
      if (editing?.id) { await updateScheduleDay(editing.id, form); toast.success('Schedule updated') }
      else { await addScheduleDay(form); toast.success('Day added') }
      setShowModal(false); await load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this day?')) return
    await deleteScheduleDay(id); toast.success('Deleted'); await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
          <p className="text-sm text-gray-500">10-day Ganeshotsav timetable</p>
        </div>
        <button onClick={openNew} className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Day
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border h-16 animate-pulse"/>)}</div>
      ) : days.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          No schedule yet. Add the first day!
        </div>
      ) : (
        <div className="space-y-3">
          {days.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
              <div className="bg-orange-100 text-orange-800 font-bold text-sm rounded-lg px-3 py-2 text-center min-w-[60px]">
                <div className="text-lg leading-none">{d.dayNumber}</div>
                <div className="text-xs font-normal">{d.date}</div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{d.dayName}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {d.events.map(e => `${e.time} — ${e.name}`).join(' · ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(d)} className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleDelete(d.id!)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Day' : 'Add Day'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day #</label>
                  <input type="number" min={1} max={10} value={form.dayNumber}
                    onChange={e => setForm(f => ({ ...f, dayNumber: +e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date (e.g. 22 Aug)</label>
                  <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="22 Aug"/>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day Name</label>
                  <input value={form.dayName} onChange={e => setForm(f => ({ ...f, dayName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Day 1 — Ganesh Sthapana"/>
                </div>
              </div>

              {/* Events */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Events</label>
                  <button onClick={addEvent} className="text-xs text-orange-600 font-medium hover:underline">+ Add event</button>
                </div>
                <div className="space-y-2">
                  {form.events.map((ev, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input value={ev.time} onChange={e => setEvent(i, 'time', e.target.value)}
                        className="w-28 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="7:00 AM"/>
                      <input value={ev.name} onChange={e => setEvent(i, 'name', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="Event name"/>
                      <input value={ev.notes} onChange={e => setEvent(i, 'notes', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="Notes (optional)"/>
                      {form.events.length > 1 &&
                        <button onClick={() => dropEvent(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold rounded-lg">
                {saving ? 'Saving…' : editing ? 'Save' : 'Add Day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
