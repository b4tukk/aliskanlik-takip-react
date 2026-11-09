import { isValidDate } from './dates'

const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))

/** Satır başına bir tamamlama: alışkanlik,hedef,renk,tarih */
export function toCSV(habits, logs) {
  const rows = [['alışkanlık', 'hedef', 'renk', 'tarih']]
  for (const h of habits) for (const d of Object.keys(logs[h.id] || {}).sort()) rows.push([h.name, h.target, h.color, d])
  return rows.map((r) => r.map(esc).join(',')).join('\n')
}

function parseRows(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}

export function fromCSV(text, today) {
  const rows = parseRows(text)
  const head = (rows[0] || []).map((h) => h.trim().toLowerCase())
  const idx = { ad: head.indexOf('alışkanlık'), hedef: head.indexOf('hedef'), renk: head.indexOf('renk'), tarih: head.indexOf('tarih') }
  if (idx.ad < 0 || idx.tarih < 0) return { habits: [], logs: {}, errors: [{ line: 1, message: 'Başlık satırı "alışkanlık" ve "tarih" sütunlarını içermeli.' }] }
  const habits = [], logs = [], errors = []
  const byName = {}
  rows.slice(1).forEach((r, i) => {
    const name = (r[idx.ad] || '').trim(), date = (r[idx.tarih] || '').trim()
    if (!name) return errors.push({ line: i + 2, message: 'Alışkanlık adı boş.' })
    if (!isValidDate(date)) return errors.push({ line: i + 2, message: `Geçersiz tarih: ${date || '(boş)'}` })
    if (date > today) return errors.push({ line: i + 2, message: `Gelecek tarih: ${date}` })
    const key = name.toLowerCase()
    if (!byName[key]) {
      const t = Number(r[idx.hedef])
      byName[key] = { id: `csv-${habits.length}`, name: name.slice(0, 40), target: Number.isInteger(t) && t >= 1 && t <= 7 ? t : 7, color: (idx.renk >= 0 && r[idx.renk]) || '#6366f1', createdAt: date }
      habits.push(byName[key])
    }
    const h = byName[key]
    if (date < h.createdAt) h.createdAt = date
    ;(logs[h.id] ||= {})[date] = true
  })
  return { habits, logs, errors }
}
