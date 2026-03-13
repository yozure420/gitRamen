import type { CommandHistory, OrderLog, Ramen } from '../../interface'

type GmLeftPanelProps = {
  score: number
  timeRemaining: number
  course: number
  ramens: Ramen[]
  activeRamen: Ramen | null
  showHelp: boolean
  showLog: boolean
  commandHistory: CommandHistory[]
  orderLogs: OrderLog[]
  isCompactLog: boolean
  isPaused: boolean
  resumeGame: () => void
  isLoading: boolean
  handleLevelChange: (newCourse: number) => void
}

function GmLeftPanel({
  score,
  timeRemaining,
  course,
  ramens,
  activeRamen,
  showHelp,
  showLog,
  commandHistory,
  orderLogs,
  isCompactLog,
  isPaused,
  resumeGame,
  isLoading,
  handleLevelChange,
}: GmLeftPanelProps) {
  const activeRamens = ramens.filter(r => !r.isCompleted)

  return (
    <div className="left-panel">
      <h2 className="panel-title">ラーメン配達</h2>

      <div className="status-card">
        <div className="status-line">
          スコア: <span className="status-value status-value-success">{score}</span>
        </div>
        <div className="status-line">
          残り時間: <span className={`status-value ${timeRemaining < 20 ? 'status-value-danger' : 'status-value-success'}`}>{timeRemaining}s</span>
        </div>
        <div className="status-course">
          コース: {course === 1 ? '🟢 初級' : course === 2 ? '🔵 中級' : course === 3 ? '🟠 上級' : '💀 誰が使うねん級'}
        </div>
      </div>

      <div className="command-list">
        <h3 className="section-title">現在のラーメン:</h3>
        {activeRamens.map(ramen => {
          const isActive = activeRamen?.id === ramen.id
          return (
            <div key={ramen.id} className={`command-item ${isActive ? 'command-item-active' : ''}`}>
              <div className={`lane-label ${isActive ? 'lane-label-active' : ''}`}>
                {isActive && '⭐ '}ラーメン #{ramen.id}{isActive && ' (操作中)'}
              </div>
              <div className={`command-text ${isActive ? 'command-text-active' : ''}`}>
                <span>📝 command: {ramen.displayCommand}</span>
                {ramen.command.game_note && <span> | 🎮 game_note: {ramen.command.game_note}</span>}
              </div>
              <div className={`command-logic ${isActive ? 'command-logic-active' : ''}`}>
                <div>🧠 命令ロジック: {ramen.logicLabel ?? '通常コマンド'}</div>
                {ramen.logicDescription && <div>{ramen.logicDescription}</div>}
                {ramen.logicExample && <div>{ramen.logicExample}</div>}
              </div>
              <div className={`lane-status ${isActive ? 'lane-status-active' : ''}`}>
                Lane {ramen.currentLane} → Lane {ramen.targetLane}
              </div>
              {ramen.stagedItems.length > 0 && (
                <div className={`staged-items ${isActive ? 'staged-items-active' : ''}`}>
                  具材: {ramen.stagedItems.join(', ')}
                </div>
              )}
              <div className={`progress-text ${isActive ? 'progress-text-active' : ''}`}>
                進行: {Math.floor(ramen.position)}%
              </div>
            </div>
          )
        })}
        {activeRamens.length === 0 && (
          <div className="empty-ramen">
            ラーメンを待っています...
          </div>
        )}
      </div>

      {showHelp && (
        <div className="hint-section hint-section-help">
          <h3 className="hint-title">💡 遊び方</h3>
          <div className="hint-content hint-content-help">
            <div>🍜 ラーメンが勝手に前進します（1個ずつ）</div>
            <div>📝 ⭐操作中のラーメンに表示されているコマンドを入力</div>
            <div>🌱 初期レーンは1つ。<code>git branch &lt;lane名&gt;</code> で最大3レーンまで開設</div>
            <div>🔀 <code>git switch lane[1-3]</code> で開設済みレーンへ移動</div>
            <div>➕ <code>git add ネギ</code> で具材追加</div>
            <div>🌟 <code>git add .</code> で全部のせ</div>
            <div>🍜 <code>git commit -m "msg"</code> で完成</div>
            <div>🎯 正しいお客さん(Lane)に届けると高得点</div>
            <div>📊 <code>git status</code> で状態確認</div>
            <div>📜 <code>git log</code> で履歴表示</div>
          </div>
        </div>
      )}

      {showLog && (
        <div className="hint-section hint-section-log">
          <h3 className="hint-title">{isCompactLog ? '🧾 git log --oneline' : '📜 git log'}</h3>
          <div className="log-list">
            {orderLogs.length === 0 && <div className="log-item">注文履歴がまだありません</div>}
            {orderLogs.slice().reverse().map((log, i) => {
              if (isCompactLog) {
                const stamp = log.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                const resultIcon = log.result === 'delivered' ? '✅' : log.result === 'failed' ? '❌' : '⏳'
                return (
                  <div key={`${log.ramenId}-${i}`} className="log-item">
                    {stamp} {resultIcon} L{log.lane} {log.orderCommand}
                  </div>
                )
              }

              return (
                <div key={`${log.ramenId}-${i}`} className="log-item">
                  #{log.ramenId} Lane{log.lane} / 注文: {log.orderCommand}
                  {log.gameNote ? ` / note: ${log.gameNote}` : ''}
                  {' / '}
                  {log.summary}
                </div>
              )
            })}
          </div>
          {isPaused && (
            <div className="level-section">
              <button className="level-btn level-btn-active" onClick={resumeGame}>▶ 再開</button>
            </div>
          )}
          {commandHistory.length > 0 && (
            <div className="hint-content" style={{ marginTop: '0.4rem' }}>
              最新入力: <code>{commandHistory[commandHistory.length - 1].command}</code>
            </div>
          )}
        </div>
      )}

      <div className="level-section">
        <div className="level-title">難易度:</div>
        <div className="level-buttons">
          {[1, 2, 3, 4].map(lvl => (
            <button
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              disabled={isLoading}
              className={`level-btn ${course === lvl ? 'level-btn-active' : ''}`}
            >
              {lvl === 1 ? '🟢' : lvl === 2 ? '🔵' : lvl === 3 ? '🟠' : '💀'} Lv{lvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GmLeftPanel
