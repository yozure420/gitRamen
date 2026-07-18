import { useState } from 'react'
import '../css/Registration.css'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth'

function Registration() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const passwordMismatchError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? 'パスワードが一致しません'
      : ''

  const handleSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault()
    setError('')

    if (username.trim() === '' || password.trim() === '') {
      setError('ユーザーネームとパスワードを入力してください')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }
    if (password !== confirmPassword) return

    setIsLoading(true)
    try {
      await registerUser(username, password)
      navigate('/login')
    } catch (err) {
      if (err instanceof Error && err.message === 'Name already registered') {
        setError('このユーザーネームは既に使用されています')
      } else {
        setError('登録に失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="registration-container">
      <div className="registration-box">
        <h1 className="registration-title">新規登録</h1>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="registration-field">
            <label htmlFor="reg-username" className="registration-label">
              ユーザーネーム
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="registration-input"
              placeholder="username"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="registration-field">
            <label htmlFor="reg-password" className="registration-label">
              パスワード
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="registration-input"
              placeholder="password"
              autoComplete="new-password"
            />
            <p className="registration-hint">※ 8文字以上で入力してください</p>
          </div>

          <div className="registration-field">
            <label htmlFor="reg-confirm-password" className="registration-label">
              パスワード（確認）
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`registration-input ${passwordMismatchError ? 'registration-input--error' : ''}`}
              placeholder="password (confirm)"
              autoComplete="new-password"
            />
            {passwordMismatchError && (
              <p className="registration-error">{passwordMismatchError}</p>
            )}
          </div>

          {error && <p className="registration-api-error">{error}</p>}

          <button type="submit" className="registration-button" disabled={isLoading}>
            {isLoading ? '送信中...' : '登録する'}
          </button>
        </form>

        <p className="registration-footer">
          既にアカウントをお持ちの方は{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="registration-link-button"
          >
            ログインに戻る
          </button>
        </p>
      </div>
    </div>
  )
}

export default Registration
