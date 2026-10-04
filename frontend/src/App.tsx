import { Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import { lazyWithReload } from './lazyWithReload'
import './css/App.css'

// ルートごとに分割して、タイトル画面の初期読み込みにゲーム本編の JS/CSS を含めない
const TitlePage = lazyWithReload(() => import('./pages/TitlePage'))
const HowToPlay = lazyWithReload(() => import('./pages/HowToPlay'))
const Settings = lazyWithReload(() => import('./pages/Settings'))
const MyPage = lazyWithReload(() => import('./pages/MyPage'))
const GmStart = lazyWithReload(() => import('./pages/GmStart'))
const GmScreen = lazyWithReload(() => import('./pages/GmScreen'))
const Login = lazyWithReload(() => import('./pages/Login'))
const Registration = lazyWithReload(() => import('./pages/Registration'))

function App() {
  return (
    <main className="app-main">
      <RouteErrorBoundary>
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
      </RouteErrorBoundary>
    </main>
  )
}

export default App
