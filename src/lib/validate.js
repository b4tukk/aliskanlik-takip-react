export const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#d946ef', '#84cc16', '#f97316']

/** Alışkanlık formunu doğrular. {ok, errors, value} */
export function validateHabit(input) {
  const errors = {}
  const name = String(input.name ?? '').trim()
  if (!name) errors.name = 'Ad boş olamaz.'
  else if (name.length > 40) errors.name = 'Ad en fazla 40 karakter olabilir.'
  const target = Number(input.target)
  if (!Number.isInteger(target) || target < 1 || target > 7) errors.target = 'Haftalık hedef 1 ile 7 arasında bir tam sayı olmalı.'
  const color = COLORS.includes(input.color) ? input.color : COLORS[0]
  const ok = Object.keys(errors).length === 0
  return { ok, errors, value: ok ? { name, target, color } : null }
}
