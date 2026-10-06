export interface Command {
    id: number
    command: string
    description: string
    game_note?: string | null
    course: number
    playable?: boolean // ゲーム内で実際に操作できるコマンドか
}

export interface SoundSettings {
    bgm: number // 0~100
    se: number // 0~100
    type: number // 0~100
    miss: number // 0~100
}

export const DEFAULT_SOUND: SoundSettings = { bgm: 50, se: 50, type: 50, miss: 50 }

export type CommandStepType =
    | 'add' | 'commit' | 'push' | 'command'
    | 'stash' | 'stash_pop' | 'reset_soft' | 'amend' // normal
    | 'reset_hard_restore' // high
    | 'commit_tree' | 'update_ref' // god

/** ステップに入った瞬間に厨房で起きる出来事 */
export type StepEnterEffect = 'drop_bowl' // 新人の reset --hard で丼（コミット）が消える

/** イベント告知に添える挿絵の種類（画像との対応は components/gmV2/gimmickIllustrations.ts） */
export type GimmickIllustration =
    | 'stash' | 'reset_soft' | 'amend' // normal
    | 'reflog' | 'bisect' | 'bisect_culprit' // high
    | 'plumbing' // god

/** ステップが「今やるべき手順」になった瞬間に表示するイベント告知 */
export interface StepEventNotice {
    title: string
    message: string
    details: string[]
    illustration?: GimmickIllustration
}

export interface CommandStep {
    id: string
    type: CommandStepType
    displayCommand: string
    expectedInputs: string[]
    logicLabel: string
    logicDescription: string
    logicExample: string
    itemName?: string
    eventNotice?: StepEventNotice
    onEnter?: StepEnterEffect
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
    isPushed: boolean // push実行済みか
    isStashed: boolean // 追加: git stashで退避されているか
    stashedItems: string[] // git stash で退避中の具材
    isLost: boolean // reset --hard で丼（コミット）が消えているか
    lostItems: string[] // 消えた丼に乗っていた具材（reflog から復元できる）
    pushedToMainFromOtherLane: boolean // 別レーンから origin main に push したか
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

export interface CustomerAlert {
    lane: number
    text: string
    label?: string
}

export interface StatusWindowData {
    title: string
    phaseMessage: string
    details: string[]
    illustration?: GimmickIllustration
}
