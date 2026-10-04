import { describe, expect, it } from 'vitest'
import { createStep } from '../../src/game/commandLogic/stepFactory'
import { advanceWorkflow, getCurrentCommandStep, getWorkflowToppingItems, isWorkflowCompleted } from '../../src/game/gameEngin/workflow'
import { makeRamen, standardSteps } from '../helpers/ramen'

describe('workflow', () => {
  it('advanceWorkflow は次の手順へ進め、表示用の値を更新する', () => {
    const ramen = makeRamen(standardSteps())
    const next = advanceWorkflow(ramen, { stagedItems: ['ネギ'] })

    expect(next.currentStepIndex).toBe(1)
    expect(next.stagedItems).toEqual(['ネギ'])
    expect(next.displayCommand).toBe('git commit -m "おまち！"')
    expect(next.isPushReady).toBe(false)
    expect(getCurrentCommandStep(next)?.type).toBe('commit')
  })

  it('push 手順の手前で isPushReady になり、最後まで進むと完了扱い', () => {
    let ramen = makeRamen(standardSteps())
    ramen = advanceWorkflow(advanceWorkflow(ramen))
    expect(ramen.isPushReady).toBe(true)
    expect(isWorkflowCompleted(ramen)).toBe(false)

    ramen = advanceWorkflow(ramen)
    expect(isWorkflowCompleted(ramen)).toBe(true)
    expect(ramen.hasRequiredCommandExecuted).toBe(true)
    expect(getCurrentCommandStep(ramen)).toBeNull()
  })

  it('onEnter: drop_bowl の手順に入ると、具材が消えて未コミットになる', () => {
    const steps = [
      ...standardSteps().slice(0, 2),
      createStep({ type: 'command', displayCommand: 'git reflog', logicLabel: 'r', logicDescription: 'r', onEnter: 'drop_bowl' }),
    ]
    const committed = makeRamen(steps, { currentStepIndex: 1, stagedItems: ['ネギ'] })

    const dropped = advanceWorkflow(committed, { isCommitted: true })
    expect(dropped).toMatchObject({ isLost: true, lostItems: ['ネギ'], stagedItems: [], isCommitted: false })
  })

  it('getWorkflowToppingItems は全 add 手順の具材を返す', () => {
    const steps = [...standardSteps('ネギ'), ...standardSteps('のり')]
    expect(getWorkflowToppingItems(makeRamen(steps))).toEqual(['ネギ', 'のり'])
  })
})
