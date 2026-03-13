import type { Command, CommandHistory, OrderLog, Ramen } from '../../types/interface'

type GmLeftPanelProps = {
  score: number
  timeRemaining: number
  course: number
  laneCount: number
  courseCommands: Command[]
  ramens: Ramen[]
  activeRamen: Ramen | null
  showHelp: boolean
  showLog: boolean
  commandHistory: CommandHistory[]
  orderLogs: OrderLog[]
  isCompactLog: boolean
  isPaused: boolean
  resumeGame: () => void
}

function GmLeftPanel({
  score,
  timeRemaining,
  course,
  laneCount,
  courseCommands,
  ramens,
  activeRamen,
  showHelp,
  showLog,
  commandHistory,
  orderLogs,
  isCompactLog,
  isPaused,
  resumeGame,
}: GmLeftPanelProps) {
  const activeRamens = ramens.filter(r => !r.isCompleted)
  const commandBlockCount = laneCount >= 2 ? 2 : 1
  const visibleCourseCommands = courseCommands.filter(cmd => cmd.id !== 1 && cmd.id !== 2)

  return (
    <div className="left-panel">
      <h2 className="panel-title">ラーメン作り中...</h2>

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
              {Array.from({ length: commandBlockCount }).map((_, idx) => (
                <div key={`${ramen.id}-order-block-${idx}`}>
                  <div className={`lane-label ${isActive ? 'lane-label-active' : ''}`}>
                    {isActive && '⭐ '}ラーメン #{ramen.id}{isActive && ' (操作中)'}
                  </div>
                  <div className={`command-text ${isActive ? 'command-text-active' : ''}`}>
                    {ramen.command.game_note && <span>注文: {ramen.command.game_note}</span>}
                    <br/>
                    <span>コマンド: {ramen.displayCommand}</span>
                  </div>
                </div>
              ))}
              <div className={`lane-status ${isActive ? 'lane-status-active' : ''}`}>
                Lane {ramen.currentLane} → Lane {ramen.targetLane}
              </div>
              <div className={`progress-text ${isActive ? 'progress-text-active' : ''}`}>
                ステップ: {Math.min(ramen.currentStepIndex + 1, ramen.steps.length)} / {ramen.steps.length}
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
            <div>📚 この難易度で出題されるコマンド一覧:</div>
            <div className="course-command-list">
              {visibleCourseCommands.map((cmd) => (
                <div key={cmd.id} className="course-command-item">
                  <code>{cmd.command}</code>
                  {cmd.game_note ? <span> - {cmd.game_note}</span> : null}
                </div>
              ))}
            </div>
          </div>
          {isPaused && (
            <div className="level-section">
              <button className="level-btn level-btn-active" onClick={resumeGame}>▶ 再開</button>
            </div>
          )}
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
                  #{log.ramenId} Lane{log.lane}<br/>{log.orderCommand}
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
    </div>
  )
}

export default GmLeftPanel
