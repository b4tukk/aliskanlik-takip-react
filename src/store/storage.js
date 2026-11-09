import { initialState } from './reducer'
import { isValidDate } from '../lib/dates'

export const STORAGE_KEY = 'aliskanlik-takip:v1'

/** Bozuk kayıtları temizler: geçersiz tarihler ve bilinmeyen alışkanlıklar atılır. */
export function sanitize(p) {
  const habits = (Array.isArray(p?.habits) ? p.habits : [])
    .filter((h) => h && typeof h.id === 'string' && typeof h.name === 'string' && h.name.trim())
    .map((h) => ({ id: h.id, name: h.name.trim().slice(0, 40), color: h.color || '#6366f1', target: Number.isInteger(h.target) && h.target >= 1 && h.target <= 7 ? h.target : 7, createdAt: isValidDate(h.createdAt) ? h.createdAt : '2000-01-01' }))
  const ids = new Set(habits.map((h) => h.id))
  const logs = {}
  for (const [id, days] of Object.entries(p?.logs && typeof p.logs === 'object' ? p.logs : {})) {
    if (!ids.has(id) || !days || typeof days !== 'object') continue
    logs[id] = Object.fromEntries(Object.keys(days).filter(isValidDate).map((d) => [d, true]))
  }
  return { habits, logs, theme: ['light', 'dark', 'system'].includes(p?.theme) ? p.theme : 'system' }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialState, ...sanitize(JSON.parse(raw)) }
  } catch {
    /* bozuk veri veya erişim engeli: boş durumla başla */
  }
  return initialState
}

export function saveState(state) {
  try {
    const { habits, logs, theme } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, habits, logs, theme }))
  } catch {
    /* depolama dolu/kapalı */
  }
}
