import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import './css/App.css'

// ルートごとに分割して、タイトル画面の初期読み込みにゲーム本編の JS/CSS を含めない
const TitlePage = lazy(() => import('./pages/TitlePage'))
const HowToPlay = lazy(() => import('./pages/HowToPlay'))
const Settings = lazy(() => import('./pages/Settings'))
const MyPage = lazy(() => import('./pages/MyPage'))
const GmStart = lazy(() => import('./pages/GmStart'))
const GmScreen = lazy(() => import('./pages/GmScreen'))
const Login = lazy(() => import('./pages/Login'))
const Registration = lazy(() => import('./pages/Registration'))

function App() {
  return (
    <main className="app-main">
      <Suspense fallback={<div className="app-loading">読み込み中…</div>}>
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
      </Suspense>
    </main>
  )
}

export default App
