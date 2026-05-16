import { useState } from 'react'
import './css/App.css'
import { GmStart, GmScreen, TitlePage, MyPage, HowToPlay, Settings, Login, Registration } from './pages/importFile';
import type { SoundSettings } from './types/interface'
import { getToken, removeToken } from './api/auth'
import { DEFAULT_SOUND } from './types/interface'

type Screen = 'title' | 'mypage' | 'howto' | 'settings' | 'game' | 'start' | 'register' | 'login'

function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getToken() !== null)
  const [selectedCourse, setSelectedCourse] = useState(1)
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(DEFAULT_SOUND)

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

      {screen === 'game' && (
        <GmScreen
          soundSettings={soundSettings}
          initialCourse={selectedCourse}
          onGoToMyPage={() => setScreen('mypage')}
          onGoToTitle={() => setScreen('title')}
        />
      )}
    </>
  )
}

export default App
