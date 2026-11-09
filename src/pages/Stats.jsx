import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store/StoreContext'
import { addDays, shortDate, todayISO } from '../lib/dates'
import { completionRate, currentStreak, heatmap, longestStreak, weekCount, weekStreak, weeklySeries } from '../lib/stats'
import Heatmap from '../components/Heatmap'

export default function Stats() {
  const { state } = useStore()
  const today = todayISO()
  const { habits, logs } = state
  const cols = useMemo(() => heatmap(logs, habits, today, 12), [logs, habits, today])
  const series = useMemo(() => weeklySeries(logs, habits, today, 8).map((s) => ({ ...s, hafta: shortDate(s.hafta) })), [logs, habits, today])
  const rows = useMemo(
    () => habits.map((h) => ({ h, streak: currentStreak(logs, h.id, today), best: longestStreak(logs, h.id), week: weekCount(logs, h.id, today), wStreak: weekStreak(logs, h, today), rate: completionRate(logs, h, addDays(today, -29), today) })),
    [habits, logs, today],
  )
  if (habits.length === 0) return <p className="empty card">İstatistik için önce alışkanlık ekleyin.</p>

  return (
    <>
      <section className="card">
        <h2>Son 12 hafta</h2>
        <Heatmap cols={cols} />
        <p className="muted legend">Az <span className="hm-cell l1" /><span className="hm-cell l2" /><span className="hm-cell l3" /><span className="hm-cell l4" /> Çok</p>
      </section>
      <section className="card">
        <h2>Haftalık tamamlama ve hedef</h2>
        <div className="chart" role="img" aria-label="Son 8 haftanın tamamlama ve hedef grafiği">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="hafta" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
              <Legend />
              <Bar dataKey="Tamamlanan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Hedef" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="card">
        <h2>Alışkanlık bazında</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Alışkanlık</th><th className="num">Seri</th><th className="num">En uzun</th><th className="num">Bu hafta</th><th className="num">Hedef serisi (hafta)</th><th className="num">Son 30 gün</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.h.id}>
                  <td><span className="swatch static" style={{ background: r.h.color }} /> {r.h.name}</td>
                  <td className="num">{r.streak}</td><td className="num">{r.best}</td><td className="num">{r.week}/{r.h.target}</td><td className="num">{r.wStreak}</td><td className="num">%{Math.round(r.rate * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
