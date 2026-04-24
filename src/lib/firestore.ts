import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, serverTimestamp,
  writeBatch, increment,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tag = 'puja' | 'event' | 'notice' | 'traffic' | 'emergency'

export interface Update {
  id?: string
  title: string
  body: string
  tag: Tag
  isPinned: boolean
  timestamp: number
  imageUrl?: string
}

export interface ScheduleEvent {
  time: string
  name: string
  notes?: string
}

export interface ScheduleDay {
  id?: string
  dayNumber: number
  date: string
  dayName: string
  events: ScheduleEvent[]
}

export interface Aarti {
  id?: string
  name: string
  lyrics: string
  order: number
  isActive: boolean
}

export interface Feedback {
  id?: string
  name: string
  phone: string
  feedback: string
  rating: number
  isAnonymous: boolean
  timestamp: number
  isRead: boolean
}

export interface Photo {
  url: string
  storagePath: string
  timestamp: number
}

export interface Album {
  id?: string
  year: number
  name: string
  coverUrl?: string
  photos: Photo[]
}

// ─── Updates ──────────────────────────────────────────────────────────────────

export const getUpdates = async (): Promise<Update[]> => {
  const q = query(collection(db, 'updates'), orderBy('timestamp', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Update))
}

export const addUpdate = (data: Omit<Update, 'id'>) =>
  addDoc(collection(db, 'updates'), { ...data, timestamp: Date.now() })

export const updateUpdate = (id: string, data: Partial<Update>) =>
  updateDoc(doc(db, 'updates', id), data)

export const deleteUpdate = (id: string) =>
  deleteDoc(doc(db, 'updates', id))

// ─── Schedule ─────────────────────────────────────────────────────────────────

export const getSchedule = async (): Promise<ScheduleDay[]> => {
  const q = query(collection(db, 'schedule'), orderBy('dayNumber'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleDay))
}

export const addScheduleDay = (data: Omit<ScheduleDay, 'id'>) =>
  addDoc(collection(db, 'schedule'), data)

export const updateScheduleDay = (id: string, data: Partial<ScheduleDay>) =>
  updateDoc(doc(db, 'schedule', id), data)

export const deleteScheduleDay = (id: string) =>
  deleteDoc(doc(db, 'schedule', id))

// ─── Aartis ───────────────────────────────────────────────────────────────────

export const getAartis = async (): Promise<Aarti[]> => {
  const q = query(collection(db, 'aartis'), orderBy('order'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Aarti))
}

export const addAarti = (data: Omit<Aarti, 'id'>) =>
  addDoc(collection(db, 'aartis'), data)

export const updateAarti = (id: string, data: Partial<Aarti>) =>
  updateDoc(doc(db, 'aartis', id), data)

export const deleteAarti = (id: string) =>
  deleteDoc(doc(db, 'aartis', id))

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const getFeedback = async (): Promise<Feedback[]> => {
  const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback))
}

export const markFeedbackRead = (id: string) =>
  updateDoc(doc(db, 'feedback', id), { isRead: true })

// ─── Gallery ──────────────────────────────────────────────────────────────────

export const getAlbums = async (): Promise<Album[]> => {
  const q = query(collection(db, 'gallery'), orderBy('year', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Album))
}

export const addAlbum = (data: Omit<Album, 'id'>) =>
  addDoc(collection(db, 'gallery'), data)

export const updateAlbum = (id: string, data: Partial<Album>) =>
  updateDoc(doc(db, 'gallery', id), data)

export const deleteAlbum = (id: string) =>
  deleteDoc(doc(db, 'gallery', id))

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const [updates, aartis, feedbackDocs, tokens] = await Promise.all([
    getDocs(collection(db, 'updates')),
    getDocs(collection(db, 'aartis')),
    getDocs(collection(db, 'feedback')),
    getDocs(collection(db, 'device_tokens')),
  ])
  const unread = feedbackDocs.docs.filter(d => !d.data().isRead).length
  return {
    updates: updates.size,
    aartis: aartis.size,
    feedback: feedbackDocs.size,
    unreadFeedback: unread,
    registeredDevices: tokens.size,
  }
}
