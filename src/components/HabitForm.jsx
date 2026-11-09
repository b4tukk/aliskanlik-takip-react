import { useState } from 'react'
import { COLORS, validateHabit } from '../lib/validate'

export default function HabitForm({ initial, onSubmit, onCancel, submitLabel = 'Ekle' }) {
  const [form, setForm] = useState(initial || { name: '', target: 5, color: COLORS[0] })
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const res = validateHabit(form)
    setErrors(res.errors)
    if (!res.ok) return
    onSubmit(res.value)
    if (!initial) setForm({ name: '', target: 5, color: COLORS[(COLORS.indexOf(form.color) + 1) % COLORS.length] })
  }

  return (
    <form className="card form" onSubmit={submit} noValidate aria-label={initial ? 'Alışkanlığı düzenle' : 'Yeni alışkanlık'}>
      <div className="grid-form">
        <label>Alışkanlık
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ör. 20 dakika kitap okumak" aria-invalid={!!errors.name} />
          {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
        </label>
        <label>Haftalık hedef (gün)
          <input type="number" min="1" max="7" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} aria-invalid={!!errors.target} />
          {errors.target && <span className="field-error" role="alert">{errors.target}</span>}
        </label>
      </div>
      <div className="colors" role="radiogroup" aria-label="Renk">
        {COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={`Renk ${c}`} className={form.color === c ? 'swatch on' : 'swatch'} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
        ))}
      </div>
      <div className="actions">
        {onCancel && <button type="button" className="ghost" onClick={onCancel}>Vazgeç</button>}
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}
