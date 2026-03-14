import { useState } from 'react'
import './css/App.css'
import GmStart from './pages/GmStart'
import GmScreen from './pages/GmScreen'
import TitlePage from './pages/TitlePage'
import MyPage from './pages/MyPage'
import HowToPlay from './pages/HowToPlay'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Registration from './pages/Registration'
import type { SoundSettings } from './types/interface'
import { getToken, removeToken } from './api/auth'

// アプリ全体で遷移しうる画面の種類
type Screen = 'title' | 'mypage' | 'howto' | 'settings' | 'game' | 'start' | 'register' | 'login'

function App() {
  // 現在表示している画面を管理する。最初はログイン画面から始まる
  const [screen, setScreen] = useState<Screen>('title')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getToken() !== null)
  const [selectedCourse, setSelectedCourse] = useState(1)
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    bgm: true,
    se: true,
    type: true,
    miss: true,
  })

  return (
    <>
      {screen === 'title' && (
        <TitlePage
          isLoggedIn={isLoggedIn}
          onStart={() => setScreen('start')}
          onMyPage={() => setScreen('mypage')}
          onHowToPlay={() => setScreen('howto')}
          onSettings={() => setScreen('settings')}
          onLogin={() => setScreen('login')}
          onRegister={() => setScreen('register')}
          onLogout={() => { removeToken(); setIsLoggedIn(false) }}
        />
      )}

      {screen === 'mypage' && (
        <MyPage
          onCourseSelect={() => setScreen('start')}
          onBackToTitle={() => setScreen('title')}
        />
      )}

      {screen === 'howto' && (
        <HowToPlay onBack={() => setScreen('title')} />
      )}

      {screen === 'settings' && (
        <Settings
          soundSettings={soundSettings}
          onChangeSoundSettings={setSoundSettings}
          onBack={() => setScreen('title')}
        />
      )}

      {screen === 'start' && (
        <GmStart onStart={(course) => {
          setSelectedCourse(course)
          setScreen('game')
        }} />
      )}

      {screen === 'login' && (
        <Login
          onLogin={() => { setIsLoggedIn(true); setScreen('title') }}
          onGoToRegister={() => setScreen('register')}
        />
      )}

      {screen === 'register' && (
        <Registration
          onRegister={() => setScreen('login')}
          onGoToLogin={() => setScreen('login')}
        />
      )}

      {/* ゲーム本編画面 */}

      {screen === 'game' && (
        <GmScreen
          soundSettings={soundSettings}
          initialCourse={selectedCourse}
          onGoToMyPage={() => setScreen('mypage')}
        />
      )}
    </>
  )
}

export default App
