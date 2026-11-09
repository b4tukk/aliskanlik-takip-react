import { describe, expect, it } from 'vitest'
import { addDays, diffDays, isValidDate, startOfWeek, weekdayIndex } from '../lib/dates'
import { completionRate, currentStreak, heatmap, insights, longestStreak, todayProgress, weekCount, weekStreak, weeklySeries } from '../lib/stats'
import { validateHabit } from '../lib/validate'
import { fromCSV, toCSV } from '../lib/csv'
import { initialState, reducer } from '../store/reducer'
import { STORAGE_KEY, loadState, sanitize, saveState } from '../store/storage'
import { sampleData } from '../lib/sample'

const TODAY = '2026-11-11' // Çarşamba
const logsOf = (id, days) => ({ [id]: Object.fromEntries(days.map((d) => [d, true])) })
const H = (o = {}) => ({ id: 'a', name: 'Su', color: '#6366f1', target: 5, createdAt: '2026-10-01', ...o })

describe('dates', () => {
  it('gün ekleme ay/yıl sınırını ve artık yılı geçer', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('yaz saati geçişinde gün sayısı bozulmaz', () => {
    expect(diffDays('2026-03-30', '2026-03-28')).toBe(2)
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
  })
  it('hafta pazartesi başlar', () => {
    expect(weekdayIndex('2026-11-09')).toBe(0)
    expect(weekdayIndex('2026-11-15')).toBe(6)
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09')
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09')
  })
  it('tarih doğrulama', () => {
    expect(isValidDate('2026-02-29')).toBe(false)
    expect(isValidDate('2024-02-29')).toBe(true)
    expect(isValidDate('11.11.2026')).toBe(false)
    expect(isValidDate(null)).toBe(false)
  })
})

describe('seriler (streak)', () => {
  it('bugün yapıldıysa bugünden geriye sayar', () => {
    expect(currentStreak(logsOf('a', ['2026-11-11', '2026-11-10', '2026-11-09']), 'a', TODAY)).toBe(3)
  })
  it('bugün henüz yapılmadıysa seri dünden sayılır, bozulmaz', () => {
    expect(currentStreak(logsOf('a', ['2026-11-10', '2026-11-09']), 'a', TODAY)).toBe(2)
  })
  it('dün de yapılmadıysa seri sıfırdır', () => {
    expect(currentStreak(logsOf('a', ['2026-11-09']), 'a', TODAY)).toBe(0)
  })
  it('boşluk seriyi böler', () => {
    expect(currentStreak(logsOf('a', ['2026-11-11', '2026-11-09', '2026-11-08']), 'a', TODAY)).toBe(1)
  })
  it('en uzun seri ay sınırını geçer', () => {
    expect(longestStreak(logsOf('a', ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-05']), 'a')).toBe(4)
    expect(longestStreak({}, 'a')).toBe(0)
  })
  it('haftalık sayı ve hedef serisi', () => {
    const logs = logsOf('a', ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10', '2026-11-11'])
    expect(weekCount(logs, 'a', '2026-11-04')).toBe(5)
    const h = H({ target: 3, createdAt: '2026-11-02' })
    expect(weekStreak(logs, h, TODAY)).toBe(2) // geçen hafta 5≥3, bu hafta 3≥3
    expect(weekStreak(logs, H({ target: 4, createdAt: '2026-11-02' }), TODAY)).toBe(1) // bu hafta henüz 3<4: seriyi bozmaz, geçen hafta sayılır
  })
  it('hafta serisi alışkanlık oluşturulmadan önceki haftaları saymaz', () => {
    const logs = logsOf('a', ['2026-11-09', '2026-11-10', '2026-11-11'])
    expect(weekStreak(logs, H({ target: 3, createdAt: '2026-11-09' }), TODAY)).toBe(1)
  })
})

describe('oran ve özetler', () => {
  it('yapılma oranı oluşturulma tarihinden başlar', () => {
    const logs = logsOf('a', ['2026-11-10', '2026-11-11'])
    expect(completionRate(logs, H({ createdAt: '2026-11-10' }), '2026-10-01', TODAY)).toBe(1)
    expect(completionRate(logs, H({ createdAt: '2026-11-08' }), '2026-10-01', TODAY)).toBeCloseTo(2 / 4)
    expect(completionRate(logs, H({ createdAt: '2026-12-01' }), '2026-10-01', TODAY)).toBe(0)
  })
  it('ısı haritası 7 satır, gelecek günleri işaretler', () => {
    const cols = heatmap(logsOf('a', [TODAY]), [H()], TODAY, 12)
    expect(cols).toHaveLength(12)
    expect(cols.every((c) => c.length === 7)).toBe(true)
    const last = cols[11]
    expect(last[0].date).toBe('2026-11-09')
    expect(last[2]).toMatchObject({ date: TODAY, count: 1, future: false })
    expect(last[3].future).toBe(true)
  })
  it('haftalık seri toplamları', () => {
    const logs = { ...logsOf('a', ['2026-11-09', '2026-11-10']), ...logsOf('b', ['2026-11-09']) }
    const s = weeklySeries(logs, [H(), H({ id: 'b', target: 2 })], TODAY, 2)
    expect(s).toHaveLength(2)
    expect(s[1]).toMatchObject({ Tamamlanan: 3, Hedef: 7 })
    expect(s[0].Tamamlanan).toBe(0)
  })
  it('bugünkü ilerleme', () => {
    expect(todayProgress(logsOf('a', [TODAY]), [H(), H({ id: 'b' })], TODAY)).toEqual({ done: 1, total: 2, ratio: 0.5 })
    expect(todayProgress({}, [], TODAY).ratio).toBe(0)
  })
  it('akıllı özet: seri, zayıf alışkanlık ve yetişilemeyen hedef', () => {
    const strong = H({ id: 'a', name: 'Su', createdAt: '2026-09-01' })
    const weak = H({ id: 'w', name: 'Meditasyon', target: 7, createdAt: '2026-09-01' })
    const logs = { ...logsOf('a', ['2026-11-11', '2026-11-10', '2026-11-09']), ...logsOf('w', ['2026-11-01']) }
    const t = insights(logs, [strong, weak], TODAY).map((x) => x.text).join(' | ')
    expect(t).toMatch(/Su: 3 günlük seri/)
    expect(t).toMatch(/Meditasyon son 30 günde %3/)
    expect(t).toMatch(/Meditasyon: bu hafta hedefe yetişmek için kalan gün yetmiyor \(0\/7\)/)
  })
  it('boş durum', () => expect(insights({}, [], TODAY)[0].tone).toBe('info'))
})

describe('validate', () => {
  it('geçerli girdi', () => expect(validateHabit({ name: '  Su ', target: '5', color: '#10b981' }).value).toEqual({ name: 'Su', target: 5, color: '#10b981' }))
  it.each([[{ name: '', target: 3 }, 'name'], [{ name: 'a'.repeat(41), target: 3 }, 'name'], [{ name: 'a', target: 0 }, 'target'], [{ name: 'a', target: 8 }, 'target'], [{ name: 'a', target: 2.5 }, 'target'], [{ name: 'a', target: 'x' }, 'target']])('geçersiz %#', (i, k) => expect(validateHabit(i).errors[k]).toBeTruthy())
  it('bilinmeyen renk varsayılana döner', () => expect(validateHabit({ name: 'a', target: 1, color: 'red' }).value.color).toBe('#6366f1'))
})

describe('csv', () => {
  it('gidiş-dönüş ve tırnaklı ad', () => {
    const habits = [H({ name: 'Kitap, 20 "dk"' })]
    const r = fromCSV(toCSV(habits, logsOf('a', ['2026-11-10', '2026-11-11'])), TODAY)
    expect(r.errors).toHaveLength(0)
    expect(r.habits[0]).toMatchObject({ name: 'Kitap, 20 "dk"', target: 5, createdAt: '2026-11-10' })
    expect(Object.keys(r.logs[r.habits[0].id])).toEqual(['2026-11-10', '2026-11-11'])
  })
  it('geçersiz, boş ve gelecek tarihli satırları atar', () => {
    const csv = 'alışkanlık,hedef,renk,tarih\nSu,5,#fff,2026-11-10\nSu,5,#fff,2026-13-01\n,5,#fff,2026-11-10\nSu,5,#fff,2027-01-01'
    const r = fromCSV(csv, TODAY)
    expect(r.habits).toHaveLength(1)
    expect(r.errors.map((e) => e.line)).toEqual([3, 4, 5])
  })
  it('başlık eksikse hata', () => expect(fromCSV('a,b\n1,2', TODAY).errors[0].message).toMatch(/Başlık/))
})

describe('reducer', () => {
  it('ekle, işaretle, geri al', () => {
    let s = reducer(initialState, { type: 'ADD_HABIT', today: TODAY, payload: { name: 'Su', target: 5, color: '#fff' } })
    const id = s.habits[0].id
    expect(s.habits[0].createdAt).toBe(TODAY)
    s = reducer(s, { type: 'TOGGLE', id, date: TODAY })
    expect(s.logs[id][TODAY]).toBe(true)
    s = reducer(s, { type: 'TOGGLE', id, date: TODAY })
    expect(s.logs[id][TODAY]).toBeUndefined()
  })
  it('silme kayıtları da siler, geri al hepsini döndürür', () => {
    let s = { ...initialState, habits: [H()], logs: logsOf('a', [TODAY]) }
    s = reducer(s, { type: 'DELETE_HABIT', id: 'a' })
    expect(s.habits).toHaveLength(0)
    expect(s.logs.a).toBeUndefined()
    s = reducer(s, { type: 'UNDO_DELETE' })
    expect(s.habits).toHaveLength(1)
    expect(s.logs.a[TODAY]).toBe(true)
    expect(reducer(initialState, { type: 'DELETE_HABIT', id: 'yok' })).toBe(initialState)
  })
  it('birleştirme aynı adlı alışkanlıkların kayıtlarını birleştirir', () => {
    const s = reducer({ ...initialState, habits: [H({ name: 'Su' })], logs: logsOf('a', ['2026-11-10']) }, { type: 'MERGE', habits: [H({ id: 'x', name: 'su' }), H({ id: 'y', name: 'Yoga' })], logs: { ...logsOf('x', ['2026-11-11']), ...logsOf('y', ['2026-11-09']) } })
    expect(s.habits.map((h) => h.name)).toEqual(['Su', 'Yoga'])
    expect(Object.keys(s.logs.a).sort()).toEqual(['2026-11-10', '2026-11-11'])
  })
  it('sıfırlama temayı korur', () => expect(reducer({ ...initialState, theme: 'dark', habits: [H()] }, { type: 'RESET' })).toMatchObject({ habits: [], theme: 'dark' }))
})

describe('storage', () => {
  it('kaydet/yükle gidiş-dönüş', () => {
    saveState({ ...initialState, habits: [H()], logs: logsOf('a', [TODAY]), theme: 'dark' })
    const s = loadState()
    expect(s.habits[0].name).toBe('Su')
    expect(s.logs.a[TODAY]).toBe(true)
    expect(s.theme).toBe('dark')
  })
  it('bozuk JSON olursa boş durumla başlar', () => {
    localStorage.setItem(STORAGE_KEY, '{bozuk')
    expect(loadState().habits).toEqual([])
  })
  it('sanitize geçersiz tarihleri ve sahipsiz kayıtları atar', () => {
    const s = sanitize({ habits: [{ id: 'a', name: ' Su ', target: 99, color: '#fff', createdAt: 'x' }, { id: 5 }], logs: { a: { '2026-11-11': true, 'xx': true }, zzz: { '2026-11-11': true } }, theme: 'neon' })
    expect(s.habits).toHaveLength(1)
    expect(s.habits[0]).toMatchObject({ name: 'Su', target: 7, createdAt: '2000-01-01' })
    expect(Object.keys(s.logs)).toEqual(['a'])
    expect(Object.keys(s.logs.a)).toEqual(['2026-11-11'])
    expect(s.theme).toBe('system')
  })
})

describe('örnek veri', () => {
  it('tutarlı: 4 alışkanlık, gelecekte kayıt yok, deterministik', () => {
    const d = sampleData(TODAY), d2 = sampleData(TODAY)
    expect(d.habits).toHaveLength(4)
    expect(JSON.stringify(d)).toBe(JSON.stringify(d2))
    expect(Object.values(d.logs).every((l) => Object.keys(l).every((x) => x <= TODAY))).toBe(true)
  })
})
