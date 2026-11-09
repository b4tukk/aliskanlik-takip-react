import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { insights, todayProgress } from '../lib/stats'
import { longDate, todayISO } from '../lib/dates'
import HabitRow from '../components/HabitRow'

export default function Today() {
  const { state, dispatch } = useStore()
  const today = todayISO()
  const { habits, logs } = state
  const p = useMemo(() => todayProgress(logs, habits, today), [logs, habits, today])
  const tips = useMemo(() => insights(logs, habits, today), [logs, habits, today])
  const toggle = (id, date) => dispatch({ type: 'TOGGLE', id, date })

  return (
    <>
      <section className="card">
        <p className="muted">{longDate(today)}</p>
        <h2>Bugünün ilerlemesi: {p.done}/{p.total}</h2>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(p.ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Bugünün ilerlemesi">
          <div className="fill" style={{ width: `${p.ratio * 100}%` }} />
        </div>
      </section>

      {habits.length === 0 ? (
        <section className="card empty-state">
          <p>Henüz alışkanlık yok. Bir tane ekleyin ya da örnek veriyle uygulamayı keşfedin.</p>
          <div className="actions center">
            <Link className="btn" to="/aliskanliklar">Alışkanlık ekle</Link>
            <Link className="btn ghost-btn" to="/veri">Örnek veri yükle</Link>
          </div>
        </section>
      ) : (
        <section className="card">
          <ul className="habits">
            {habits.map((h) => <HabitRow key={h.id} habit={h} logs={logs} today={today} onToggle={toggle} />)}
          </ul>
        </section>
      )}

      <section className="card" aria-label="Akıllı özet">
        <h2>Akıllı özet</h2>
        <ul className="tips">{tips.map((t, i) => <li key={i} className={t.tone}>{t.text}</li>)}</ul>
      </section>
    </>
  )
}
