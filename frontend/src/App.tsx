import { useState } from 'react'
import './css/App.css'
import TitlePage from './TitlePage'
import Login from './Login'
import Registration from './Registration'
import MyPage from './MyPage'
import HowToPlay from './HowToPlay'
import Settings from './Settings'
import type { SoundSettings } from './Settings'
import GmStart from './GmStart'
import GmScreen from './GmScreen'

type Screen = 'title' | 'login' | 'register' | 'mypage' | 'howto' | 'settings' | 'start' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token')
  })
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    bgm: true,
    se: true,
    type: true,
    miss: true,
  })

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem('access_token', newToken)
    setScreen('title')
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('access_token')
    setScreen('title')
  }

  return (
    <>
      {screen === 'title' && (
        <TitlePage
          onStart={() => setScreen('start')}
          onMyPage={() => setScreen('mypage')}
          onHowToPlay={() => setScreen('howto')}
          onSettings={() => setScreen('settings')}
          onLogin={() => setScreen('login')}
          onLogout={handleLogout}
          onRegister={() => setScreen('register')}
          isLoggedIn={!!token}
        />
      )}

      {screen === 'login' && (
        <Login
          onLogin={handleLogin}
          onGoToRegister={() => setScreen('register')}
        />
      )}

      {screen === 'register' && (
        <Registration
          onRegister={() => setScreen('login')}
          onGoToLogin={() => setScreen('login')}
        />
      )}

      {screen === 'mypage' && (
        <MyPage
          token={token}
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
        <GmStart onStart={() => setScreen('game')} />
      )}

      {/* ゲーム本編画面 */}

      {screen === 'game' && <GmScreen soundSettings={soundSettings} />}
    </>
  )
}

export default App
