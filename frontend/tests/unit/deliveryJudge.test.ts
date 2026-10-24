import { describe, expect, it } from 'vitest'
import { evaluateDelivery } from '../../src/game/gameEngin/deliveryJudge'
import { makeRamen, standardSteps } from '../helpers/ramen'

const completed = (overrides = {}) => makeRamen(standardSteps(), {
  currentStepIndex: 3,
  stagedItems: ['ネギ'],
  isCommitted: true,
  isPushed: true,
  ...overrides,
})

describe('evaluateDelivery', () => {
  it('手順完了・同じレーン・具材ありなら成功し、コース倍率で加点', () => {
    expect(evaluateDelivery(completed(), 1)).toMatchObject({ result: 'delivered', scoreDelta: 100 })
    expect(evaluateDelivery(completed(), 4)).toMatchObject({ result: 'delivered', scoreDelta: 400 })
  })

  it('未コミットで push すると空振りプッシュ', () => {
    const outcome = evaluateDelivery(completed({ isCommitted: false }), 2)
    expect(outcome).toMatchObject({ result: 'failed', scoreDelta: -140, errorLabel: '空振りプッシュ' })
  })

  it('別レーンから main へ push すると push先ミス', () => {
    const outcome = evaluateDelivery(completed({ pushedToMainFromOtherLane: true }), 1)
    expect(outcome).toMatchObject({ result: 'failed', errorLabel: 'push先ミス' })
  })

  it('手順が残ったまま push すると手順未完了でクレーム', () => {
    const outcome = evaluateDelivery(completed({ currentStepIndex: 1 }), 3)
    expect(outcome).toMatchObject({ result: 'failed', scoreDelta: -50, errorLabel: '手順未完了' })
    expect(outcome.customerWarning).toBeDefined()
  })

  it('push せずに流れ切った場合は手順未完了だがクレーム吹き出しは出さない', () => {
    const outcome = evaluateDelivery(completed({ currentStepIndex: 0, isPushed: false, isCommitted: false, stagedItems: [] }), 1)
    expect(outcome.result).toBe('failed')
    expect(outcome.customerWarning).toBeUndefined()
  })

  it('複数の add 手順のうち1つでも具材が欠けていれば味判定失敗', () => {
    const steps = [...standardSteps('ネギ').slice(0, 2), ...standardSteps('のり')]
    const ramen = makeRamen(steps, { currentStepIndex: steps.length, stagedItems: ['ネギ'], isCommitted: true, isPushed: true })
    expect(evaluateDelivery(ramen, 1)).toMatchObject({ result: 'failed', summary: '味判定失敗: のりなし' })
  })

  it('目的のレーンと違うレーンに届くと誤配達', () => {
    expect(evaluateDelivery(completed({ currentLane: 2, targetLane: 1 }), 1)).toMatchObject({ result: 'failed', errorLabel: '誤配達' })
  })
})
