import { useState } from 'react'
import './Login.css'
import { loginUser, saveToken } from './api/auth'

// ログイン画面が必要とする外部コールバック
interface LoginProps {
  /** ログイン成功時に呼ばれる */
  onLogin: () => void
  /** 「新規登録はこちら」押下時に呼ばれる */
  onGoToRegister: () => void
}

function Login({ onLogin, onGoToRegister }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  /** API エラーや入力ミス時にフォーム下部に表示するメッセージ */
  const [error, setError] = useState('')
  /** API 通信中は二重送信を防ぐためボタンを無効化する */
  const [isLoading, setIsLoading] = useState(false)

  /**
   * フォーム送信ハンドラ。
   * バックエンドの POST /api/auth/login を呼び、成功時に JWT を保存して遷移する。
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username.trim() === '' || password.trim() === '') {
      setError('ユーザーネームとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      const data = await loginUser(username, password)
      saveToken(data.access_token)
      onLogin()
    } catch (err) {
      // バックエンドが返すエラーメッセージ（例: "Invalid name or password"）を表示
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">ログイン</h1>

        <form onSubmit={handleSubmit} className="login-form">
          {/* ユーザーネーム入力 */}
          <div className="login-field">
            <label htmlFor="login-username" className="login-label">
              ユーザーネーム
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              placeholder="username"
              autoFocus
              autoComplete="username"
            />
          </div>

          {/* パスワード入力 */}
          <div className="login-field">
            <label htmlFor="login-password" className="login-label">
              パスワード
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="password"
              autoComplete="current-password"
            />
          </div>

          {/* API エラー・入力ミス時のエラーメッセージ */}
          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '送信中...' : 'ログイン'}
          </button>
        </form>

        {/* 新規登録への導線 */}
        <p className="login-footer">
          アカウントをお持ちでない方は{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="login-link-button"
          >
            新規登録はこちら
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
