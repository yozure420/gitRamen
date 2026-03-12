import { useState } from 'react'
import './App.css'
import TitlePage from './TitlePage'
import MyPage from './MyPage'
import HowToPlay from './HowToPlay'
import Settings from './Settings'
import GmStart from './GmStart'
import GmScreen from './GmScreen'

type Screen = 'title' | 'mypage' | 'howto' | 'settings' |  'start' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [soundSettings, setSoundSettings] = useState<SoundSettings>({
    bgm: true,
    se: true,
    type: true,
    miss: true
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

      {screen === 'game' && <GmScreen />}
    </>
  )
}

export default App
