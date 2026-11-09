import { addDays, diffDays, startOfWeek, weekdayIndex } from './dates'

/** logs: { [habitId]: { 'YYYY-AA-GG': true } } */
export const isDone = (logs, id, date) => Boolean(logs[id]?.[date])
const datesOf = (logs, id) => Object.keys(logs[id] || {}).sort()

/** Bugünden (yapılmadıysa dünden) geriye ardışık günlerin sayısı. */
export function currentStreak(logs, id, today) {
  let day = isDone(logs, id, today) ? today : addDays(today, -1)
  let n = 0
  while (isDone(logs, id, day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function longestStreak(logs, id) {
  const ds = datesOf(logs, id)
  let best = 0, run = 0, prev = null
  for (const d of ds) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

/** Haftanın (Pzt–Paz) içinde tamamlanan gün sayısı. */
export function weekCount(logs, id, anyDayInWeek) {
  const start = startOfWeek(anyDayInWeek)
  let n = 0
  for (let i = 0; i < 7; i++) if (isDone(logs, id, addDays(start, i))) n++
  return n
}

/** Haftalık hedefi tutturan ardışık hafta sayısı. İçinde bulunulan hafta henüz bitmediyse, tutturulmuşsa sayılır, tutturulmamışsa seriyi bozmaz. */
export function weekStreak(logs, habit, today) {
  const created = startOfWeek(habit.createdAt)
  let week = startOfWeek(today)
  let n = 0
  if (weekCount(logs, habit.id, week) >= habit.target) n++
  week = addDays(week, -7)
  while (week >= created && weekCount(logs, habit.id, week) >= habit.target) {
    n++
    week = addDays(week, -7)
  }
  return n
}

/** [from..to] aralığında yapılma oranı (0–1). Alışkanlık oluşturulmadan önceki günler paydaya girmez. */
export function completionRate(logs, habit, from, to) {
  const start = from < habit.createdAt ? habit.createdAt : from
  if (start > to) return 0
  const total = diffDays(to, start) + 1
  let done = 0
  for (let i = 0; i < total; i++) if (isDone(logs, habit.id, addDays(start, i))) done++
  return done / total
}

/** Son `weeks` hafta için {tarih, sayi} dizisi (haftalar sütun, gün satır; pazartesi başlangıç). */
export function heatmap(logs, habits, endDate, weeks = 12) {
  const lastWeekStart = startOfWeek(endDate)
  const cols = []
  for (let w = weeks - 1; w >= 0; w--) {
    const ws = addDays(lastWeekStart, -7 * w)
    cols.push(
      Array.from({ length: 7 }, (_, d) => {
        const date = addDays(ws, d)
        const future = date > endDate
        const count = future ? 0 : habits.filter((h) => isDone(logs, h.id, date)).length
        return { date, count, future, total: habits.length }
      }),
    )
  }
  return cols
}

/** Son n hafta için toplam tamamlama ve hedefe oranı. */
export function weeklySeries(logs, habits, endDate, n = 8) {
  const last = startOfWeek(endDate)
  return Array.from({ length: n }, (_, i) => {
    const ws = addDays(last, -7 * (n - 1 - i))
    let done = 0, goal = 0
    for (const h of habits) {
      done += Math.min(weekCount(logs, h.id, ws), 7)
      goal += h.target
    }
    return { hafta: ws, Tamamlanan: done, Hedef: goal, oran: goal ? done / goal : 0 }
  })
}

export function todayProgress(logs, habits, today) {
  const done = habits.filter((h) => isDone(logs, h.id, today)).length
  return { done, total: habits.length, ratio: habits.length ? done / habits.length : 0 }
}

/** Sıralı "akıllı özet" cümleleri. */
export function insights(logs, habits, today) {
  if (habits.length === 0) return [{ tone: 'info', text: 'Başlamak için bir alışkanlık ekleyin.' }]
  const out = []
  const rows = habits.map((h) => ({ h, streak: currentStreak(logs, h.id, today), rate: completionRate(logs, h, addDays(today, -29), today), week: weekCount(logs, h.id, today) }))
  const top = [...rows].sort((a, b) => b.streak - a.streak)[0]
  if (top.streak >= 3) out.push({ tone: 'good', text: `${top.h.name}: ${top.streak} günlük seri sürüyor.` })
  const weak = [...rows].filter((r) => diffDays(today, r.h.createdAt) >= 13).sort((a, b) => a.rate - b.rate)[0]
  if (weak && weak.rate < 0.5) out.push({ tone: 'warn', text: `${weak.h.name} son 30 günde %${Math.round(weak.rate * 100)} oranında yapıldı; hedefi küçültmeyi düşünün.` })
  const idx = weekdayIndex(today)
  const behind = rows.filter((r) => {
    const daysLeft = 6 - idx + (isDone(logs, r.h.id, today) ? 0 : 1) // bugün yapılmadıysa bugün de sayılır
    return r.h.target - r.week > daysLeft
  })
  behind.slice(0, 2).forEach((r) => out.push({ tone: 'bad', text: `${r.h.name}: bu hafta hedefe yetişmek için kalan gün yetmiyor (${r.week}/${r.h.target}).` }))
  const p = todayProgress(logs, habits, today)
  out.push({ tone: p.done === p.total ? 'good' : 'info', text: p.done === p.total ? 'Bugünün tüm alışkanlıkları tamam.' : `Bugün ${p.done}/${p.total} tamamlandı.` })
  return out
}
