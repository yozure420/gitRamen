import { useState } from 'react'
import './Registration.css'

// 新規登録画面が必要とする外部コールバック
interface RegistrationProps {
  /** 登録完了時に呼ばれる。呼び出し元でログイン画面へ遷移させる */
  onRegister: () => void
  /** 「ログインに戻る」押下時に呼ばれる */
  onGoToLogin: () => void
}

function Registration({ onRegister, onGoToLogin }: RegistrationProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  /**
   * パスワード不一致エラーメッセージ。
   * 確認用パスワードが入力されていて、かつ一致しない場合のみ表示する。
   * (入力中に早期にエラーを出さないよう、confirmPassword が空のときは非表示)
   */
  const passwordMismatchError =
    confirmPassword.length > 0 && password !== confirmPassword
      ? 'パスワードが一致しません'
      : ''

  /**
   * フォーム送信ハンドラ。
   * 全フィールドが入力済みかつパスワードが一致している場合のみ登録を進める。
   * 将来的にはここで API 呼び出しを行い、成功後に onRegister() を呼ぶ。
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (username.trim() === '' || password.trim() === '') return
    if (password !== confirmPassword) return

    onRegister()
  }

  return (
    <div className="registration-container">
      <div className="registration-box">
        <h1 className="registration-title">新規登録</h1>

        <form onSubmit={handleSubmit} className="registration-form">
          {/* ユーザーネーム入力 */}
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

          {/* パスワード入力（1回目） */}
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
          </div>

          {/* パスワード確認入力（2回目）＋不一致エラー */}
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
            {/* エラーメッセージ: パスワード不一致のときのみ表示 */}
            {passwordMismatchError && (
              <p className="registration-error">{passwordMismatchError}</p>
            )}
          </div>

          <button type="submit" className="registration-button">
            登録する
          </button>
        </form>

        {/* ログイン画面への導線 */}
        <p className="registration-footer">
          既にアカウントをお持ちの方は{' '}
          <button
            type="button"
            onClick={onGoToLogin}
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
