import { adjustCheckoutStepsForStartLane, createRandomLane, resolveTargetLane } from './laneUtils'
import type { Ramen } from '../../types/interface'
import type { CreateRamenEntryParams } from './types'

export function createRamenEntry(params: CreateRamenEntryParams): Ramen {
  const {
    id,
    command,
    steps,
    laneCount,
    speed,
    targetLaneOverride,
  } = params

  const startLane = createRandomLane(laneCount)
  const adjustedSteps = adjustCheckoutStepsForStartLane(steps, startLane, laneCount)
  const firstStep = adjustedSteps[0]
  const targetLane = resolveTargetLane({
    firstStep,
    startLane,
    laneCount,
    targetLaneOverride,
  })

  return {
    id,
    command,
    steps: adjustedSteps,
    currentStepIndex: 0,
    displayCommand: firstStep?.displayCommand ?? command.command,
    expectedInputs: firstStep?.expectedInputs ?? [command.command],
    logicLabel: firstStep?.logicLabel ?? '通常コマンド',
    logicDescription: firstStep?.logicDescription ?? '表示されたコマンドをそのまま入力。',
    logicExample: firstStep?.logicExample ?? `例: ${command.command}`,
    currentLane: startLane,
    targetLane,
    position: 0,
    isCompleted: false,
    stagedItems: [],
    isCommitted: false,
    isPushed: false,
    pushedToMainFromOtherLane: false,
    commandsExecuted: 0,
    pushThreshold: steps.length,
    isPushReady: firstStep?.type === 'push',
    speed,
    hasRequiredCommandExecuted: false,
  }
}
