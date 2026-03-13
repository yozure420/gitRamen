import type { CommandStep, Ramen } from '../types/interface'

export type DeliveryOutcome = {
  scoreDelta: number
  result: 'delivered' | 'failed'
  summary: string
  message: string
  customerWarning?: string
  errorLabel?: string
}

export function getCurrentCommandStep(ramen: Ramen): CommandStep | null {
  return ramen.steps[ramen.currentStepIndex] ?? null
}

export function isWorkflowCompleted(ramen: Ramen): boolean {
  return ramen.currentStepIndex >= ramen.steps.length
}

export function getWorkflowToppingItems(ramen: Ramen): string[] {
  return ramen.steps
    .filter(step => step.type === 'add' && step.itemName)
    .map(step => step.itemName as string)
}

export function advanceWorkflow(ramen: Ramen, overrides: Partial<Ramen> = {}): Ramen {
  const nextStepIndex = ramen.currentStepIndex + 1
  const nextStep = ramen.steps[nextStepIndex] ?? null

  return {
    ...ramen,
    ...overrides,
    currentStepIndex: nextStepIndex,
    displayCommand: nextStep?.displayCommand ?? ramen.displayCommand,
    expectedInputs: nextStep?.expectedInputs ?? [],
    logicLabel: nextStep?.logicLabel ?? ramen.logicLabel,
    logicDescription: nextStep?.logicDescription ?? ramen.logicDescription,
    logicExample: nextStep?.logicExample ?? ramen.logicExample,
    isPushReady: nextStep?.type === 'push',
    hasRequiredCommandExecuted: nextStepIndex >= ramen.steps.length,
  }
}

export function getRequiredToppingForRamen(ramen: Ramen): string | null {
  const currentStep = getCurrentCommandStep(ramen)
  if (!currentStep || currentStep.type !== 'add') {
    return null
  }
  const topping = currentStep.displayCommand.replace(/^git add\s+/i, '').trim()
  return topping || null
}

type CreateRamenEntryParams = {
  id: number
  command: Ramen['command']
  steps: CommandStep[]
  laneCount: number
  speed: number
  targetLaneOverride?: number | 'startLane'
}

export function selectLaneRamens(ramens: Ramen[], lane: number): Ramen[] {
  return ramens.filter(r => r.currentLane === lane && !r.isCompleted)
}

export function selectActiveRamen(ramens: Ramen[]): Ramen | null {
  const activeRamens = ramens.filter(r => !r.isCompleted)
  if (activeRamens.length === 0) return null
  return activeRamens.reduce((prev, curr) => (prev.position > curr.position ? prev : curr))
}

export function canSpawnRamen(params: {
  now: number
  lastSpawnAt: number
  ramens: Ramen[]
  minSpawnDelay: number
  minPositionGap: number
  maxRamens: number
}): boolean {
  const { now, lastSpawnAt, ramens, minSpawnDelay, minPositionGap, maxRamens } = params
  const timeSinceLastSpawn = now - lastSpawnAt
  if (lastSpawnAt !== 0 && timeSinceLastSpawn < minSpawnDelay) {
    return false
  }

  const activeRamens = ramens.filter(r => !r.isCompleted)
  if (activeRamens.length >= maxRamens) {
    return false
  }

  if (activeRamens.length > 0) {
    const minPosition = Math.min(...activeRamens.map(r => r.position))
    if (minPosition < minPositionGap) {
      return false
    }
  }

  return true
}

function adjustCheckoutStepsForStartLane(steps: CommandStep[], startLane: number, laneCount: number): CommandStep[] {
  return steps.map((step) => {
    const match = step.displayCommand.match(/^git checkout lane([1-3])$/i)
    if (!match) return step

    const requestedLane = Number(match[1])
    let nextLane = requestedLane

    if (requestedLane === startLane) {
      const laneOptions = Array.from({ length: laneCount }, (_, index) => index + 1)
        .filter((lane) => lane !== startLane)

      if (laneOptions.length === 0) {
        return step
      }

      nextLane = laneOptions[Math.floor(Math.random() * laneOptions.length)]
    }

    const nextCommand = `git checkout lane${nextLane}`

    return {
      ...step,
      id: `${step.type}:${nextCommand}`,
      displayCommand: nextCommand,
      expectedInputs: step.expectedInputs.map((input) => {
        if (input.match(/^git checkout lane([1-3])$/i)) {
          return nextCommand
        }
        return input
      }),
      logicDescription: `現在は lane${startLane}。注文先 lane${nextLane} に切り替えてから調理する。`,
      logicExample: `例: ${nextCommand}`,
    }
  })
}

export function createRamenEntry(params: CreateRamenEntryParams): Ramen {
  const {
    id,
    command,
    steps,
    laneCount,
    speed,
    targetLaneOverride,
  } = params

  const startLane = Math.floor(Math.random() * laneCount) + 1
  const adjustedSteps = adjustCheckoutStepsForStartLane(steps, startLane, laneCount)
  const firstStep = adjustedSteps[0]
  const checkoutLaneMatch = firstStep?.displayCommand.match(/^git checkout lane([1-3])$/i)
  const targetLane = (() => {
    if (checkoutLaneMatch) {
      return Number(checkoutLaneMatch[1])
    }

    if (targetLaneOverride === 'startLane') {
      return startLane
    }

    if (typeof targetLaneOverride === 'number') {
      return Math.min(Math.max(1, targetLaneOverride), laneCount)
    }

    return Math.floor(Math.random() * laneCount) + 1
  })()

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

export function evaluateDelivery(ramen: Ramen, course: number): DeliveryOutcome {
  if (ramen.isPushed && !ramen.isCommitted) {
    const penalty = 70 * course
    return {
      scoreDelta: -penalty,
      result: 'failed',
      summary: '空振りプッシュ: 未コミットのまま配達',
      message: `💥 空振りプッシュ！中身が入っていない！ (-${penalty}点)`,
      customerWarning: '中身が入っていない！まずい！',
      errorLabel: '空振りプッシュ',
    }
  }

  if (ramen.isPushed && ramen.pushedToMainFromOtherLane) {
    const penalty = 60 * course
    return {
      scoreDelta: -penalty,
      result: 'failed',
      summary: '誤配達: 別レーンから origin main へ push',
      message: `❌ 注文ミス！別レーンから main へ届けてしまいました (-${penalty}点)`,
      customerWarning: '注文が間違ってる！main宛てになってる💢',
      errorLabel: 'push先ミス',
    }
  }

  if (!isWorkflowCompleted(ramen)) {
    return {
      scoreDelta: -50,
      result: 'failed',
      summary: 'ワークフロー未完了で配達失敗',
      message: '❌ 失敗！必要な手順を完了する前に流れてしまいました (-50点)',
    }
  }

  if (ramen.currentLane === ramen.targetLane) {
    const requiredTopping = getRequiredToppingForRamen(ramen)
    if (requiredTopping && !ramen.stagedItems.includes(requiredTopping)) {
      const penalty = 30 * course
      return {
        scoreDelta: -penalty,
        result: 'failed',
        summary: `味判定失敗: ${requiredTopping}なし`,
        message: `🤢 まずい…「${requiredTopping}」が入ってない！ (-${penalty}点)`,
      }
    }

    const point = 100 * course
    return {
      scoreDelta: point,
      result: 'delivered',
      summary: `味判定成功: うまい / Lane ${ramen.targetLane}`,
      message: `😋 うまい！Lane ${ramen.targetLane} のお客さんに届きました！ +${point}点`,
    }
  }

  return {
    scoreDelta: -50,
    result: 'failed',
    summary: `配達先ミス: Lane ${ramen.targetLane}`,
    message: `❌ 誤配達！Lane ${ramen.targetLane} の注文なのに別レーンへ届けました (-50点)`,
    customerWarning: 'これ頼んでないんだけど💢',
    errorLabel: '誤配達',
  }
}
