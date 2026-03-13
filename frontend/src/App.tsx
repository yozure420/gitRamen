import { useState } from 'react'
import './css/App.css'
import Login from './Login'
import Registration from './Registration'
import GmStart from './GmStart'
import GmScreen from './GmScreen'

// アプリ全体で遷移しうる画面の種類
type Screen = 'login' | 'register' | 'main_menu' | 'game' | 'start'

function App() {
  // 現在表示している画面を管理する。最初はログイン画面から始まる
  const [screen, setScreen] = useState<Screen>('game')

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
