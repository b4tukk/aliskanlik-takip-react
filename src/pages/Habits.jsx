import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import { todayISO } from '../lib/dates'
import HabitForm from '../components/HabitForm'

export default function Habits() {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState(null)
  return (
    <>
      {editing && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Alışkanlığı düzenle">
          <HabitForm initial={editing} submitLabel="Kaydet" onCancel={() => setEditing(null)} onSubmit={(v) => { dispatch({ type: 'UPDATE_HABIT', id: editing.id, payload: v }); setEditing(null) }} />
        </div>
      )}
      <section className="card">
        <h2>Alışkanlıklarım</h2>
        {state.habits.length === 0 ? <p className="empty">Henüz alışkanlık yok.</p> : (
          <ul className="manage">
            {state.habits.map((h) => (
              <li key={h.id}>
                <span className="swatch static" style={{ background: h.color }} />
                <span className="grow"><strong>{h.name}</strong><small className="muted"> · haftada {h.target} gün</small></span>
                <button className="ghost" onClick={() => setEditing(h)} aria-label={`${h.name} alışkanlığını düzenle`}>Düzenle</button>
                <button className="ghost danger" onClick={() => dispatch({ type: 'DELETE_HABIT', id: h.id })} aria-label={`${h.name} alışkanlığını sil`}>Sil</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <h2 className="section-title">Yeni alışkanlık</h2>
      <HabitForm onSubmit={(v) => dispatch({ type: 'ADD_HABIT', today: todayISO(), payload: v })} />
    </>
  )
}
