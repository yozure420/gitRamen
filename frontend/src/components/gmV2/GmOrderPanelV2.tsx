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

/**
 * commitステップの displayCommand から注文タイトルを生成する。
 * "git commit -m "XXXラーメンYYY入りおまち！"" → "XXXラーメンYYY"
 * 上記形式でない場合は commitCommand をそのまま返す。
 */
function resolveOrderTitle(ramen: Ramen): string {
    const commitStep = ramen.steps.find(s => s.type === 'commit')
    if (!commitStep) {
        return ramen.command.game_note ?? ramen.displayCommand
    }
    const match = commitStep.displayCommand.match(/^git commit -m "(.+)入りおまち！"$/)
    return match ? match[1] : commitStep.displayCommand
}

/** git branch による新来客イベントかどうかを判定する。 */
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

    const targetLaneName = lanes[ramen.targetLane - 1] ?? `Lane ${ramen.targetLane}`
    const toppingNames = ramen.steps
        .filter(step => step.type === 'add' && step.itemName)
        .map(step => step.itemName as string)
    const isStaged = (topping: string) => ramen.stagedItems.includes(topping)

    if (isBranchEvent(ramen)) {
        const branchCommand = ramen.steps[0]?.displayCommand ?? ''
        // "git branch akamaru-42" → "akamaru-42"
        const newBranchName = branchCommand.replace(/^git branch\s+/i, '').trim() || branchCommand
        return (
            <div className="order-panel">
                <div className="receipt-slip">
                    <div className="receipt-slip-header">
                        <span className="receipt-slip-lane">新規来客</span>
                        <span className="receipt-slip-branch receipt-slip-branch--new">{newBranchName}</span>
                    </div>
                    <div className="receipt-slip-command">{branchCommand}</div>
                </div>
            </div>
        )
    }

    const orderTitle = resolveOrderTitle(ramen)
    const commitStep = ramen.steps.find(s => s.type === 'commit')

    return (
        <div className="order-panel">
            <div className="receipt-slip">
                <div className="receipt-slip-header">
                    <span className="receipt-slip-lane">レーン {ramen.targetLane}</span>
                    <span className="receipt-slip-branch">{targetLaneName}</span>
                </div>
                <div className="receipt-slip-title">{orderTitle}</div>
                {commitStep && (
                    <div className="receipt-slip-command">{commitStep.displayCommand}</div>
                )}
                {toppingNames.length > 0 && (
                    <div className="toppings">
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