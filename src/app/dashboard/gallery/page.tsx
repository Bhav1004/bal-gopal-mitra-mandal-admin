'use client'
import { useEffect, useState, useRef } from 'react'
import { getAlbums, addAlbum, updateAlbum, deleteAlbum, type Album, type Photo } from '@/lib/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import toast from 'react-hot-toast'

export default function GalleryPage() {
  const [albums, setAlbums]         = useState<Album[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeAlbum, setActive]    = useState<Album | null>(null)
  const [showNew, setShowNew]       = useState(false)
  const [newYear, setNewYear]       = useState(new Date().getFullYear())
  const [newName, setNewName]       = useState('')
  const [uploading, setUploading]   = useState(false)
  const fileRef                     = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const all = await getAlbums()
      setAlbums(all)
      if (activeAlbum) setActive(all.find(a => a.id === activeAlbum.id) ?? null)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const createAlbum = async () => {
    if (!newName.trim()) { toast.error('Album name required'); return }
    await addAlbum({ year: newYear, name: newName, photos: [] })
    toast.success('Album created')
    setShowNew(false); setNewName(''); await load()
  }

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Delete album and all its photos?')) return
    await deleteAlbum(id)
    if (activeAlbum?.id === id) setActive(null)
    toast.success('Album deleted'); await load()
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || !activeAlbum?.id) return
    setUploading(true)
    const newPhotos: Photo[] = []
    try {
      for (const file of Array.from(files)) {
        const path = `gallery/${activeAlbum.id}/${Date.now()}_${file.name}`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        newPhotos.push({ url, storagePath: path, timestamp: Date.now() })
      }
      const updated = [...(activeAlbum.photos ?? []), ...newPhotos]
      await updateAlbum(activeAlbum.id, { photos: updated, coverUrl: updated[0]?.url })
      toast.success(`${newPhotos.length} photo(s) uploaded`)
      await load()
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  const handleDeletePhoto = async (photo: Photo) => {
    if (!activeAlbum?.id) return
    if (!confirm('Delete this photo?')) return
    try {
      const storageRef = ref(storage, photo.storagePath)
      await deleteObject(storageRef)
    } catch { /* storage object may already be gone */ }
    const updated = (activeAlbum.photos ?? []).filter(p => p.storagePath !== photo.storagePath)
    await updateAlbum(activeAlbum.id, { photos: updated, coverUrl: updated[0]?.url ?? '' })
    toast.success('Photo deleted'); await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gallery</h2>
          <p className="text-sm text-gray-500">Year-wise photo albums</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + New Album
        </button>
      </div>

      {/* New album modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Create Album</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <input type="number" value={newYear} onChange={e => setNewYear(+e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Album Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ganeshotsav 2026"/>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={createAlbum} className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-5">
        {/* Albums sidebar */}
        <div className="w-56 shrink-0">
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl border h-20 animate-pulse"/>)}</div>
          ) : albums.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No albums</p>
          ) : (
            <div className="space-y-2">
              {albums.map(a => (
                <div key={a.id}
                  onClick={() => setActive(a)}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${activeAlbum?.id === a.id ? 'border-orange-400 bg-orange-50' : 'bg-white border-gray-200 hover:border-orange-200'}`}>
                  {a.coverUrl ? (
                    <img src={a.coverUrl} alt={a.name} className="w-full h-24 object-cover rounded-lg mb-2"/>
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-3xl">🖼️</div>
                  )}
                  <p className="font-semibold text-sm text-gray-900 truncate">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.year} · {a.photos?.length ?? 0} photos</p>
                  <button onClick={e => { e.stopPropagation(); handleDeleteAlbum(a.id!) }}
                    className="mt-1.5 text-xs text-red-400 hover:text-red-600">Delete album</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photo grid */}
        <div className="flex-1">
          {!activeAlbum ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
              Select an album to manage photos
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{activeAlbum.name}</h3>
                <div className="flex gap-2 items-center">
                  {uploading && <span className="text-xs text-orange-600">Uploading…</span>}
                  <button onClick={() => fileRef.current?.click()}
                    className="text-sm bg-white border border-gray-300 hover:border-orange-400 px-3 py-1.5 rounded-lg text-gray-700 font-medium">
                    ↑ Upload photos
                  </button>
                  <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={e => handleUpload(e.target.files)}/>
                </div>
              </div>

              {(!activeAlbum.photos || activeAlbum.photos.length === 0) ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 h-48 flex flex-col items-center justify-center text-gray-400 gap-2 text-sm cursor-pointer hover:border-orange-300 transition-colors"
                  onClick={() => fileRef.current?.click()}>
                  <span className="text-3xl">📸</span>
                  Click to upload photos
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {activeAlbum.photos.map((photo, i) => (
                    <div key={i} className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-square">
                      <img src={photo.url} alt="" className="w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <button onClick={() => handleDeletePhoto(photo)}
                          className="opacity-0 group-hover:opacity-100 bg-red-600 text-white text-xs px-2 py-1 rounded transition-opacity">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Upload more tile */}
                  <div onClick={() => fileRef.current?.click()}
                    className="rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 aspect-square flex items-center justify-center cursor-pointer text-gray-400 text-2xl transition-colors">
                    +
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
