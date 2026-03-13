import { useState } from 'react'
import './css/App.css'
import GmStart from './pages/GmStart'
import GmScreen from './pages/GmScreen'
import TitlePage from './pages/TitlePage'
import MyPage from './pages/MyPage'
import HowToPlay from './pages/HowToPlay'
import Settings from './pages/Settings'
import type { SoundSettings } from './types/interface'

// アプリ全体で遷移しうる画面の種類
type Screen = 'title' | 'mypage' | 'howto' | 'settings' | 'game' | 'start'

function App() {
  // 現在表示している画面を管理する。最初はログイン画面から始まる
  const [screen, setScreen] = useState<Screen>('title')
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
          onStart={() => setScreen('start')}
          onMyPage={() => setScreen('mypage')}
          onHowToPlay={() => setScreen('howto')}
          onSettings={() => setScreen('settings')}
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
        <GmStart onStart={() => setScreen('game')} />
      )}

      {/* ゲーム本編画面 */}

      {screen === 'game' && <GmScreen soundSettings={soundSettings} />}
    </>
  )
}

export default App
