import type { Ramen } from '../interface'

export type DeliveryOutcome = {
  scoreDelta: number
  result: 'delivered' | 'failed'
  summary: string
  message: string
}

export function getRequiredToppingForRamen(ramen: Ramen): string | null {
  if (ramen.command.command.toLowerCase() !== 'git add <file>') {
    return null
  }
  const topping = ramen.displayCommand.replace(/^git add\s+/i, '').trim()
  return topping || null
}

type CreateRamenEntryParams = {
  id: number
  command: Ramen['command']
  displayCommand: string
  expectedInputs: string[]
  logicLabel: string
  logicDescription: string
  logicExample: string
  laneCount: number
  speed: number
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

export function createRamenEntry(params: CreateRamenEntryParams): Ramen {
  const {
    id,
    command,
    displayCommand,
    expectedInputs,
    logicLabel,
    logicDescription,
    logicExample,
    laneCount,
    speed,
  } = params

  const startLane = Math.floor(Math.random() * laneCount) + 1
  const targetLane = Math.floor(Math.random() * laneCount) + 1

  return {
    id,
    command,
    displayCommand,
    expectedInputs,
    logicLabel,
    logicDescription,
    logicExample,
    currentLane: startLane,
    targetLane,
    position: 0,
    isCompleted: false,
    stagedItems: [],
    isCommitted: false,
    commandsExecuted: 0,
    pushThreshold: Math.floor(Math.random() * 2) + 2,
    isPushReady: false,
    speed,
    hasRequiredCommandExecuted: false,
  }
}

export function evaluateDelivery(ramen: Ramen, course: number): DeliveryOutcome {
  if (!ramen.hasRequiredCommandExecuted) {
    return {
      scoreDelta: -50,
      result: 'failed',
      summary: '命令未達成で配達失敗',
      message: '❌ 失敗！命令未達成のまま配達してしまいました (-50点)',
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
    message: `❌ 間違い！Lane ${ramen.targetLane} に届けるべきでした (-50点)`,
  }
}
