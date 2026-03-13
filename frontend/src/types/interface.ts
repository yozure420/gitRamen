export interface Command {
    id: number
    command: string
    description: string
    game_note?: string | null
    course: number
}

export interface SoundSettings {
    bgm: boolean
    se: boolean
    type: boolean
    miss: boolean
}

export type CommandStepType = 'add' | 'commit' | 'push' | 'command'

export interface CommandStep {
    id: string
    type: CommandStepType
    displayCommand: string
    expectedInputs: string[]
    logicLabel: string
    logicDescription: string
    logicExample: string
    itemName?: string
}

export interface Ramen {
    id: number
    command: Command
    steps: CommandStep[]
    currentStepIndex: number
    displayCommand: string
    expectedInputs: string[]
    logicLabel?: string
    logicDescription?: string
    logicExample?: string
    currentLane: number
    targetLane: number
    position: number // 0-100
    isCompleted: boolean
    stagedItems: string[] // 追加: git addで追加した具材
    isCommitted: boolean // 追加: git commitしたか
    commandsExecuted: number // 実行済みコマンド数
    pushThreshold: number    // pushReadyになるまでのコマンド数（2か3）
    isPushReady: boolean     // git push origin mainで届けられる状態
    speed: number            // 移動速度（push後に高速化）
    hasRequiredCommandExecuted: boolean // 注文コマンドを達成したか
}

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