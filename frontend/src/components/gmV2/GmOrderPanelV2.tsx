import type { Command, Ramen } from "../../types/interface"

type GmOrderPanelV2Props = {
  ramen: Ramen | null
  lanes: string[]
  showHelp: boolean
  courseCommands: Command[]
  isPaused: boolean
  resumeGame: () => void
  onGoToTitle: () => void
}

function resolveOrderTitle(ramen: Ramen): string {
  const commitStep = ramen.steps.find(s => s.type === 'commit')
  if (!commitStep) {
    return ramen.command.game_note ?? ramen.displayCommand
  }
  const match = commitStep.displayCommand.match(/^git commit -m "(.+)"$/)
  return match ? match[1] : commitStep.displayCommand
}

function isBranchEvent(ramen: Ramen): boolean {
  return ramen.command.game_note?.includes('お客さんいらっしゃいました') ?? false
}

function GmOrderPanelV2({
  ramen,
  lanes,
  showHelp,
  courseCommands,
  isPaused,
  resumeGame,
  onGoToTitle,
}: GmOrderPanelV2Props) {
  if (showHelp) {
    const visibleCommands = courseCommands.filter(cmd => cmd.id !== 1 && cmd.id !== 2)
    return (
      <div className="order-panel">
        <div className="receipt-slip">
          <div className="hint-title-row">
            <div className="hint-title">コマンド一覧</div>
            {isPaused && (
              <div className="top-panel-pause-btns">
                <button className="top-panel-pause-btn" onClick={resumeGame}>▶ 再開</button>
                <button className="top-panel-pause-btn" onClick={onGoToTitle}>タイトルへ戻る</button>
              </div>
            )}
          </div>
          <div className="course-command-list">
            {visibleCommands.map(cmd => (
              <div key={cmd.id} className="course-command-item">
                <code>{cmd.command}</code>
                {cmd.game_note && <span> - {cmd.game_note}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!ramen) {
    return (
      <div className="order-panel">
        <div className="receipt-slip">
          <div className="receipt-slip-waiting">— git pull で注文を受け取れ！ —</div>
        </div>
      </div>
    )
  }

  const isBranch = isBranchEvent(ramen)
  const targetLaneName = lanes[ramen.targetLane - 1] ?? `Lane ${ramen.targetLane}`
  const orderTitle = resolveOrderTitle(ramen)

  // 新規来客の時はブランチ名を抽出
  let newBranchName = ""
  if (isBranch) {
    const branchCommand = ramen.steps[0]?.displayCommand ?? ''
    newBranchName = branchCommand.replace(/^git branch\s+/i, '').trim() || branchCommand
  }

  return (
    <div className="order-panel">
      <div className="receipt-slip">
        <div className="receipt-slip-header">
          {/* ブランチ作成時と通常時でヘッダーの表示を切り替え */}
          {isBranch ? (
            <>
              <span className="receipt-slip-lane">新規来客</span>
              <span className="receipt-slip-branch receipt-slip-branch--new">{newBranchName}</span>
            </>
          ) : (
            <>
              <span className="receipt-slip-lane">レーン {ramen.targetLane}</span>
              <span className="receipt-slip-branch">{targetLaneName}</span>
            </>
          )}
        </div>

        {/* 注文のタイトル（〇〇ラーメン〇〇入りおまち！） */}
        <div className="receipt-slip-title">{orderTitle}</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '4px' }}>

          {/* 1. すべてのコマンド（branch, add, commit, status等）を共通でループ表示！ */}
          {ramen.steps.map((step, idx) => {
            const isCompleted = step.type === 'commit'
              ? ramen.isCommitted
              : ramen.currentStepIndex > idx;

            return (
              <div key={idx} className={`receipt-slip-command ${isCompleted ? 'receipt-slip-command-completed' : ''}`}>
                <span style={{ opacity: 0.5, marginRight: '6px' }}>{idx + 1}.</span>
                {step.displayCommand}
              </div>
            );
          })}

          {/* 2. 最後に必ず git push origin main を1つだけ表示！ */}
          <div className={`receipt-slip-command ${ramen.isPushed ? 'receipt-slip-command-completed' : ''}`}>
            <span style={{ opacity: 0.5, marginRight: '6px' }}>{ramen.steps.length + 1}.</span>
            git push origin main
          </div>

        </div>
      </div>
    </div>
  )
}

export default GmOrderPanelV2
