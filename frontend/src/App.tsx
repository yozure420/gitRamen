import { useState } from 'react'
import './App.css'
import Login from './Login'
import Registration from './Registration'
import GmStart from './GmStart'
import GmScreen from './GmScreen'

// アプリ全体で遷移しうる画面の種類
type Screen = 'login' | 'register' | 'main_menu' | 'game'　| 'start'

function App() {
  // 現在表示している画面を管理する。最初はログイン画面から始まる
  const [screen, setScreen] = useState<Screen>('login')

  return (
    <>
      {/* ログイン画面: 成功 → main_menu、新規登録ボタン → register */}
      {screen === 'login' && (
        <Login
          onLogin={() => setScreen('main_menu')}
          onGoToRegister={() => setScreen('register')}
        />
      )}

      {/* 新規登録画面: 登録完了 → login、ログインに戻る → login */}
      {screen === 'register' && (
        <Registration
          onRegister={() => setScreen('login')}
          onGoToLogin={() => setScreen('login')}
        />
      )}

      {/* ゲームスタート画面: "git init" 入力 → game */}
      {screen === 'start' && (
        <GmStart onStart={() => setScreen('game')} />
      )}

      {/* ゲーム本編画面 */}
      {screen === 'game' && <GmScreen />}
    </>
  )
}

export default App
