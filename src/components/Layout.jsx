import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../store/StoreContext'

const NEXT = { system: 'light', light: 'dark', dark: 'system' }
const ICON = { system: '🖥️ Sistem', light: '☀️ Açık', dark: '🌙 Koyu' }

export default function Layout() {
  const { state, dispatch } = useStore()
  const { lastDeleted } = state
  return (
    <div className="app">
      <header className="top">
        <h1>🌱 Alışkanlık Takip</h1>
        <nav aria-label="Ana menü">
          <NavLink to="/" end>Bugün</NavLink>
          <NavLink to="/aliskanliklar">Alışkanlıklar</NavLink>
          <NavLink to="/istatistik">İstatistik</NavLink>
          <NavLink to="/veri">Veri</NavLink>
        </nav>
        <button className="ghost" onClick={() => dispatch({ type: 'SET_THEME', theme: NEXT[state.theme] })} aria-label="Temayı değiştir">{ICON[state.theme]}</button>
      </header>
      <main><Outlet /></main>
      {lastDeleted && (
        <div className="toast" role="status">
          “{lastDeleted.habit.name}” silindi.
          <button className="ghost" onClick={() => dispatch({ type: 'UNDO_DELETE' })}>Geri al</button>
          <button className="ghost" onClick={() => dispatch({ type: 'CLEAR_UNDO' })} aria-label="Kapat">✕</button>
        </div>
      )}
      <footer>React + Vite · veriler yalnızca bu tarayıcıda (LocalStorage) saklanır</footer>
    </div>
  )
}
