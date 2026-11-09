import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store/StoreContext'
import Layout from './components/Layout'
import Today from './pages/Today'
import Habits from './pages/Habits'
import Stats from './pages/Stats'
import DataPage from './pages/DataPage'
import './App.css'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Today />} />
            <Route path="aliskanliklar" element={<Habits />} />
            <Route path="istatistik" element={<Stats />} />
            <Route path="veri" element={<DataPage />} />
            <Route path="*" element={<p className="empty">Sayfa bulunamadı.</p>} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
