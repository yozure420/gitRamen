import { useState } from 'react'
import './App.css'
import TitlePage from './TitlePage'
import MyPage from './MyPage'
import GmStart from './GmStart'
import GmScreen from './GmScreen'

type Screen = 'title' | 'mypage' | 'start' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('title')

  return (
    <>
      {screen === 'title' && (
        <TitlePage
          onStart={() => setScreen('start')}
          onMyPage={() => setScreen('mypage')}
          // onHowToPlay={() => console.log('遊び方')}
          // onSettings={() => console.log('設定')}
          // onLogin={() => console.log('ログイン')}
          // onRegister={() => console.log('新規登録')}
        />
      )}

      {screen === 'mypage' && (
        <MyPage
          onCourseSelect={() => setScreen('start')}
          onBackToTitle={() => setScreen('title')}
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
