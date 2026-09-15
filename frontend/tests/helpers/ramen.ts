import { createStep } from '../../src/game/commandLogic/stepFactory'
import { createRamenEntry } from '../../src/game/gameEngin/ramenFactory'
import type { CommandStep, Ramen } from '../../src/types/interface'

export const AVAILABLE_ITEMS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン', 'ナルト']

export function makeRamen(steps: CommandStep[], overrides: Partial<Ramen> = {}): Ramen {
  const ramen = createRamenEntry({
    id: 1,
    command: { id: 99, command: steps[0]?.displayCommand ?? 'git pull', description: 'test', course: 1 },
    steps,
    laneCount: 1,
    speed: 0.12,
    targetLaneOverride: 1,
  })
  return { ...ramen, currentLane: 1, targetLane: 1, ...overrides }
}

export function standardSteps(topping = 'ネギ', branch = 'main'): CommandStep[] {
  return [
    createStep({ type: 'add', displayCommand: `git add ${topping}`, logicLabel: 'add', logicDescription: 'add', itemName: topping }),
    createStep({ type: 'commit', displayCommand: 'git commit -m "おまち！"', logicLabel: 'commit', logicDescription: 'commit' }),
    createStep({ type: 'push', displayCommand: `git push origin ${branch}`, logicLabel: 'push', logicDescription: 'push' }),
  ]
}
