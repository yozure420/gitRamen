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

  if (isBranchEvent(ramen)) {
    const branchCommand = ramen.steps[0]?.displayCommand ?? ''
    const newBranchName = branchCommand.replace(/^git branch\s+/i, '').trim() || branchCommand
    const isCompleted = ramen.currentStepIndex > 0

    return (
      <div className="order-panel">
        <div className="receipt-slip">
          <div className="receipt-slip-header">
            <span className="receipt-slip-lane">新規来客</span>
            <span className="receipt-slip-branch receipt-slip-branch--new">{newBranchName}</span>
          </div>
          <div className={`receipt-slip-command ${isCompleted ? 'receipt-slip-command-completed' : ''}`}>
            1. {branchCommand}
          </div>
        </div>
      </div>
    )
  }

  const targetLaneName = lanes[ramen.targetLane - 1] ?? `Lane ${ramen.targetLane}`
  const toppingNames = ramen.steps
    .filter(step => step.type === 'add' && step.itemName)
    .map(step => step.itemName as string)
  const isStaged = (topping: string) => ramen.stagedItems.includes(topping)

  const orderTitle = resolveOrderTitle(ramen)

  return (
    <div className="order-panel">
      <div className="receipt-slip">
        <div className="receipt-slip-header">
          <span className="receipt-slip-lane">レーン {ramen.targetLane}</span>
          <span className="receipt-slip-branch">{targetLaneName}</span>
        </div>
        <div className="receipt-slip-title">{orderTitle}</div>

        {/* 👇 全てのコマンド（add含む）を番号付きで順番通りに表示！ */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          {ramen.steps.map((step, idx) => {
            const isCompleted = step.type === 'commit' ? ramen.isCommitted : ramen.currentStepIndex > idx
            return (
              <div key={idx} className={`receipt-slip-command ${isCompleted ? 'receipt-slip-command-completed' : ''}`}>
                <span style={{ opacity: 0.5, marginRight: '6px' }}>{idx + 1}.</span>
                {step.displayCommand}
              </div>
            )
          })}
        </div>

        {/* トッピングの丸いバッジ（おまけ表示） */}
        {toppingNames.length > 0 && (
          <div className="toppings" style={{ marginTop: '2px' }}>
            {toppingNames.map((toppingName) => (
              <div
                key={toppingName}
                className={isStaged(toppingName) ? 'added-topping-name' : 'topping-name'}
              >
                {toppingName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GmOrderPanelV2