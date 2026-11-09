import { useState } from 'react'
import { useStore } from '../store/StoreContext'
import { fromCSV, toCSV } from '../lib/csv'
import { sampleData } from '../lib/sample'
import { sanitize } from '../store/storage'
import { todayISO } from '../lib/dates'

const download = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

export default function DataPage() {
  const { state, dispatch } = useStore()
  const [msg, setMsg] = useState(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    e.target.value = ''
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const p = sanitize(JSON.parse(text))
        dispatch({ type: 'MERGE', habits: p.habits, logs: p.logs })
        setMsg({ ok: true, text: `${p.habits.length} alışkanlık içe aktarıldı.` })
      } else {
        const r = fromCSV(text, todayISO())
        if (r.habits.length) dispatch({ type: 'MERGE', habits: r.habits, logs: r.logs })
        setMsg({ ok: r.habits.length > 0, text: `${r.habits.length} alışkanlık içe aktarıldı${r.errors.length ? `, ${r.errors.length} satır atlandı` : ''}.`, errors: r.errors.slice(0, 5) })
      }
    } catch {
      setMsg({ ok: false, text: 'Dosya okunamadı. Geçerli bir CSV ya da JSON seçin.' })
    }
  }

  return (
    <>
      <section className="card">
        <h2>Dışa aktar</h2>
        <div className="actions left">
          <button onClick={() => download('aliskanliklar.csv', toCSV(state.habits, state.logs), 'text/csv')}>CSV indir</button>
          <button className="ghost" onClick={() => download('yedek.json', JSON.stringify({ habits: state.habits, logs: state.logs }, null, 2), 'application/json')}>JSON yedek</button>
        </div>
      </section>
      <section className="card">
        <h2>İçe aktar</h2>
        <p className="muted">CSV başlıkları: <code>alışkanlık,hedef,renk,tarih</code> (her satır bir tamamlanan gün). Geçersiz ve gelecek tarihli satırlar atlanır. Aynı adlı alışkanlıklar birleştirilir.</p>
        <input type="file" accept=".csv,.json" onChange={onFile} aria-label="Dosya seç" />
        {msg && (
          <div role="status" className={msg.ok ? 'ok-msg' : 'field-error'}>
            {msg.text}
            {msg.errors?.map((e) => <div key={e.line}>Satır {e.line}: {e.message}</div>)}
          </div>
        )}
      </section>
      <section className="card">
        <h2>Örnek veri ve sıfırlama</h2>
        <div className="actions left">
          <button onClick={() => { const d = sampleData(todayISO()); dispatch({ type: 'LOAD', habits: d.habits, logs: d.logs }) }}>Örnek veriyi yükle</button>
          <button className="ghost danger" onClick={() => window.confirm('Tüm veriler silinecek. Emin misiniz?') && dispatch({ type: 'RESET' })}>Tüm verileri sil</button>
        </div>
      </section>
    </>
  )
}
