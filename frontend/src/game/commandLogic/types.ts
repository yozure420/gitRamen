import type { Command, CommandStep, GimmickIllustration } from '../../types/interface'

/** コマンドを複数組み合わせることで一つのラーメンに対するコマンド群にしたもの。 */
export type RuntimeCommandLogic = {
  steps: CommandStep[]
}

export type PullOrderPayload = {
  command: Command
  runtimeLogic: RuntimeCommandLogic
  orderText: string
  noticeTitle?: string
  noticeDetails?: string[]
  noticeIllustration?: GimmickIllustration
  targetLaneOverride?: number | 'startLane' | 'newLane'
}

/** 注文に仕込まれる厨房ギミックの種類 */
export type OrderEventType = 'standard' | 'stash' | 'reset_soft' | 'amend' | 'reflog' | 'bisect' | 'plumbing'

export type CreateLaneAwarePullOrderParams = {
  course: number
  baseCommandId: number
  laneCount: number
  maxLanes: number
  existingBranches: string[]
  currentLane?: number
}

export type CommandLogicRule = {
  commandMatcher: RegExp
  buildRuntimeLogic: (command: Command) => RuntimeCommandLogic
}
