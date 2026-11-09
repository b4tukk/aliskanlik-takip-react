import { addDays } from './dates'

// Deterministik (seedli) örnek veri: son 10 hafta
function rng(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

export function sampleData(today) {
  const r = rng(7)
  const specs = [
    { id: 's-su', name: 'Su içmek (2 litre)', color: '#06b6d4', target: 7, p: 0.85 },
    { id: 's-oku', name: 'Kitap okumak (20 dk)', color: '#6366f1', target: 5, p: 0.7 },
    { id: 's-yuru', name: 'Yürüyüş (30 dk)', color: '#10b981', target: 4, p: 0.55 },
    { id: 's-medit', name: 'Meditasyon', color: '#d946ef', target: 3, p: 0.35 },
  ]
  const createdAt = addDays(today, -69)
  const habits = specs.map((s) => ({ id: s.id, name: s.name, color: s.color, target: s.target, createdAt }))
  const logs = {}
  for (const s of specs) {
    logs[s.id] = {}
    for (let i = 69; i >= 0; i--) {
      const d = addDays(today, -i)
      const boost = i < 14 ? 0.1 : 0 // son haftalarda iyileşme
      if (r() < s.p + boost) logs[s.id][d] = true
    }
  }
  return { habits, logs }
}
