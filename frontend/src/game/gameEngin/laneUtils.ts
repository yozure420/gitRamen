import type { CommandStep } from '../../types/interface'

export function createRandomLane(laneCount: number): number {
  return Math.floor(Math.random() * laneCount) + 1
}

export function clampLane(lane: number, laneCount: number): number {
  return Math.min(Math.max(1, lane), laneCount)
}

export function resolveTargetLane(params: {
  firstStep: CommandStep | undefined
  startLane: number
  laneCount: number
  targetLaneOverride?: number | 'startLane'
}): number {
  const { firstStep, startLane, laneCount, targetLaneOverride } = params
  const checkoutLaneMatch = firstStep?.displayCommand.match(/^git checkout lane([1-3])$/i)

  if (checkoutLaneMatch) {
    return Number(checkoutLaneMatch[1])
  }

  if (targetLaneOverride === 'startLane') {
    return startLane
  }

  if (typeof targetLaneOverride === 'number') {
    return clampLane(targetLaneOverride, laneCount)
  }

  return createRandomLane(laneCount)
}

export function adjustCheckoutStepsForStartLane(steps: CommandStep[], startLane: number, laneCount: number): CommandStep[] {
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
