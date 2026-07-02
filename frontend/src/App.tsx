import { Routes, Route } from 'react-router-dom'
import './css/App.css'
import { GmStart, GmScreen, TitlePage, MyPage, HowToPlay, Settings, Login, Registration } from './pages/importFile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TitlePage />} />
      <Route path="/howto" element={<HowToPlay />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/start" element={<GmStart />} />
      <Route path="/game" element={<GmScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Registration />} />
    </Routes>
  )
}

export default App
