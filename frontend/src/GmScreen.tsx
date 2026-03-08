import './GmScreen.css'
import { useState } from 'react'

function GmScreen() {
  const [command, setCommand] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Command executed:', command)
    // ここでコマンド処理を実装
    setCommand('')
  }

  return (
    <div className="game-container">
      {/* 左パネル - コマンド一覧 */}
      <div className="left-panel">
        <h2 className="panel-title">命令</h2>
        <div className="command-list">
          <div className="command-item">
            <div className="lane-label">Lane1</div>
            <div className="command-desc">ネギ追加</div>
          </div>
          <div className="divider"></div>
          <div className="command-item">
            <div className="lane-label">Lane3</div>
            <div className="command-desc">バターの追加をキャンセル</div>
            <div className="command-example">(git revert "バター")</div>
          </div>
        </div>
        <div className="hint-section">
          <h3 className="hint-title">ヒント</h3>
          <div className="hint-content">
            適切なGitコマンドを入力してラーメンを操作しよう
          </div>
        </div>
      </div>

      {/* 中央パネル - ゲームレーン */}
      <div className="center-panel">
        <div className="lane">
          <div className="ramen-object">
            <span>ラーメン</span>
          </div>
        </div>
        <div className="lane">
          <div className="ramen-object">
            <span>ラーメン</span>
          </div>
        </div>
        <div className="lane">
          <div className="ramen-object">
            <span>ラーメン</span>
          </div>
        </div>
      </div>

      {/* 右パネル - プレイヤー */}
      <div className="right-panel">
        <div className="customer">客1</div>
        <div className="customer">客2</div>
        <div className="customer">客3</div>
      </div>

      {/* 画面下部 - コマンド入力 */}
      <div className="bottom-panel">
        <p className="input-label">gitコマンドを入力してください</p>
        <form onSubmit={handleSubmit} className="command-form">
          <div className="command-input-wrapper">
            <span className="prompt">&gt;</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="command-input"
              placeholder="git commit, git revert..."
              autoFocus
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default GmScreen
