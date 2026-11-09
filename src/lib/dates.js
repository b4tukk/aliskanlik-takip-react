// Tarihler 'YYYY-AA-GG' dizisi olarak tutulur; hesaplar UTC ile yapılır (saat dilimi/yaz saati kaymasını önler).
const toUTC = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
const fromUTC = (ms) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
const DAY = 86400000

export const isValidDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUTC(toUTC(s)) === s

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const addDays = (iso, n) => fromUTC(toUTC(iso) + n * DAY)
export const diffDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / DAY)

/** Pazartesi=0 … Pazar=6 */
export const weekdayIndex = (iso) => (new Date(toUTC(iso)).getUTCDay() + 6) % 7
export const startOfWeek = (iso) => addDays(iso, -weekdayIndex(iso))

export const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
export const shortDate = (iso) => `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
export const longDate = (iso) => new Date(toUTC(iso)).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
