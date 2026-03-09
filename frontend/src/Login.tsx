import { useState } from 'react'
import './Login.css'

// ログイン画面が必要とする外部コールバック
interface LoginProps {
  /** ログイン成功時に呼ばれる（バックエンド連携後はここで認証処理を行う） */
  onLogin: () => void
  /** 「新規登録はこちら」押下時に呼ばれる */
  onGoToRegister: () => void
}

function Login({ onLogin, onGoToRegister }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  /**
   * フォーム送信ハンドラ。
   * 現時点ではバックエンド連携なしのため、入力が空でなければそのまま遷移する。
   * 将来的にはここで API 呼び出しを行い、認証結果に応じて onLogin() を呼ぶ。
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() === '' || password.trim() === '') return
    onLogin()
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

          <button type="submit" className="login-button">
            ログイン
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
