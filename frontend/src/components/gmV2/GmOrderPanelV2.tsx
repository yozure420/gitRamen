import React, { useEffect, useRef } from 'react'
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
  return ramen.steps.some(s => s.displayCommand.startsWith('git branch'))
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // オートスクロール（進捗が変わるたびに下へスクロール）
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [ramen?.currentStepIndex, ramen?.isCommitted, ramen?.isPushed])

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
    const branchCommand = ramen.steps.find(s => s.displayCommand.startsWith('git branch'))?.displayCommand ?? ''
    newBranchName = branchCommand.replace(/^git branch\s+/i, '').trim()
  }

  // 👇 プッシュ先を賢く判定（新規来客なら新しい名前、既存ならターゲットのレーン名）
  const pushBranchName = isBranch ? newBranchName : targetLaneName

  // 万が一、裏側のプログラムが push ステップを作ってしまっていても重複しないように除外する
  const displaySteps = ramen.steps.filter(step => step.type !== 'push')

  return (
    <div className="order-panel">
      <div className="receipt-slip" ref={scrollContainerRef}>
        <div className="receipt-slip-header">
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

        <div className="receipt-slip-title">{orderTitle}</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '4px' }}>
          
          {/* 1. 通常のステップ（status, branch, add, commit等）をループ表示 */}
          {displaySteps.map((step, idx) => {
            const isCompleted = step.type === 'commit' ? ramen.isCommitted : ramen.currentStepIndex > idx

            return (
              <div key={idx} className={`receipt-slip-command ${isCompleted ? 'receipt-slip-command-completed' : ''}`}>
                <span style={{ opacity: 0.5, marginRight: '6px' }}>{idx + 1}.</span>
                {step.displayCommand}
              </div>
            );
          })}

          {/* 👇 2. 最後に必ず `git push origin 〇〇` を確実に追加表示する！ */}
          <div className={`receipt-slip-command ${ramen.isPushed ? 'receipt-slip-command-completed' : ''}`}>
            <span style={{ opacity: 0.5, marginRight: '6px' }}>{displaySteps.length + 1}.</span>
            git push origin {pushBranchName}
          </div>

        </div>
      </div>
    </div>
  )
}

export default GmOrderPanelV2