import type { Command, CommandStep } from '../../types/interface'

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
  targetLaneOverride?: number | 'startLane'
}

export type CreateLaneAwarePullOrderParams = {
  course: number
  ramenId: number
  baseCommandId: number
  laneCount: number
  maxLanes: number
  existingBranches: string[]
}

export type CommandLogicRule = {
  commandMatcher: RegExp
  buildRuntimeLogic: (command: Command) => RuntimeCommandLogic
}
