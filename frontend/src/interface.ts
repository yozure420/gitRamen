// バックエンドから取得するコマンド
export interface Command {
    id: number
    command: string
    description: string
    game_note?: string | null
    course: number
}

// ゲーム内のラーメンオブジェクト
export interface Ramen {
    id: number
    command: Command
    displayCommand: string
    expectedInputs: string[]
    logicLabel?: string
    logicDescription?: string
    logicExample?: string
    currentLane: number
    targetLane: number
    position: number // 0-100（100に達したら配達判定）
    isCompleted: boolean
    stagedItems: string[] // 追加: git addで追加した具材
    isCommitted: boolean // 追加: git commitしたか
    commandsExecuted: number // 実行済みコマンド数
    pushThreshold: number    // pushReadyになるまでのコマンド数（2か3）
    isPushReady: boolean     // git push origin mainで届けられる状態
    speed: number            // 移動速度（push後に高速化）
    hasRequiredCommandExecuted: boolean // 注文コマンドを達成したか
}

// コマンド入力履歴
export interface CommandHistory {
    command: string
    timestamp: Date
}

export interface OrderLog {
    ramenId: number
    lane: number
    orderCommand: string
    gameNote?: string | null
    result: 'pending' | 'delivered' | 'failed'
    summary: string
    timestamp: Date
}
