import { useState } from 'react'
import '../css/Login.css'
import { useNavigate } from 'react-router-dom'
import { loginUser, saveToken } from '../api/auth'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']> = async (e) => {
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
      navigate('/')
    } catch (err) {
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
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '送信中...' : 'ログイン'}
          </button>
        </form>
        <p className="login-footer">
          アカウントをお持ちでない方は{' '}
          <button type="button" onClick={() => navigate('/register')} className="login-link-button">
            新規登録はこちら
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
