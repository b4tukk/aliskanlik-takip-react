import { addDays, DAY_NAMES, weekdayIndex } from '../lib/dates'
import { currentStreak, isDone, weekCount } from '../lib/stats'

/** Bugünün işaretlenmesi + son 7 günün şeridi (geçmiş günler de düzeltilebilir). */
export default function HabitRow({ habit, logs, today, onToggle }) {
  const done = isDone(logs, habit.id, today)
  const streak = currentStreak(logs, habit.id, today)
  const week = weekCount(logs, habit.id, today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))

  return (
    <li className="habit" style={{ '--c': habit.color }}>
      <button className={done ? 'check on' : 'check'} role="checkbox" aria-checked={done} aria-label={`${habit.name}: bugün ${done ? 'yapıldı' : 'yapılmadı'}`} onClick={() => onToggle(habit.id, today)}>
        {done ? '✓' : ''}
      </button>
      <div className="habit-main">
        <strong>{habit.name}</strong>
        <small className="muted">
          {streak > 0 ? `🔥 ${streak} gün seri` : 'Seri yok'} · bu hafta {week}/{habit.target}
        </small>
      </div>
      <div className="strip" aria-label="Son 7 gün">
        {days.map((d) => (
          <button key={d} className={isDone(logs, habit.id, d) ? 'dot on' : 'dot'} aria-label={`${habit.name} ${d}: ${isDone(logs, habit.id, d) ? 'yapıldı' : 'yapılmadı'}`} title={d} onClick={() => onToggle(habit.id, d)}>
            {DAY_NAMES[weekdayIndex(d)][0]}
          </button>
        ))}
      </div>
    </li>
  )
}
