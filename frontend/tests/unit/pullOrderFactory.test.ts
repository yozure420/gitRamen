import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLaneAwarePullOrderPayload } from '../../src/game/commandLogic'
import { NEW_ORDER_NOTICE } from '../../src/game/commandLogic/constants'
import { forceOrderEvent } from '../helpers/gameHarness'

const baseParams = { course: 1, baseCommandId: 7, laneCount: 1, maxLanes: 3, existingBranches: ['main'], currentLane: 1 }

afterEach(() => forceOrderEvent(null))

describe('createLaneAwarePullOrderPayload', () => {
  it('レーンに空きがあり乱数が来客確率未満なら、ブランチ作成から始まる来客注文になる', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const payload = createLaneAwarePullOrderPayload(baseParams)

    const commands = payload.runtimeLogic.steps.map(s => s.displayCommand)
    expect(commands[0]).toMatch(/^git branch lane-\d+$/)
    expect(commands[1]).toBe(commands[0].replace('branch', 'checkout'))
    expect(commands.at(-1)).toBe(commands[0].replace('branch', 'push origin'))
    expect(payload.targetLaneOverride).toBe('newLane')
    expect(payload.noticeTitle).toBe('新規来客')
  })

  it('レーンが上限なら来客は発生せず既存レーンの注文になる', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const payload = createLaneAwarePullOrderPayload({ ...baseParams, laneCount: 3, existingBranches: ['main', 'a', 'b'] })
    expect(payload.runtimeLogic.steps[0].displayCommand).not.toMatch(/^git branch/)
    expect(payload.noticeTitle).toBe(NEW_ORDER_NOTICE)
  })

  it('対象レーンが現在地と違えば checkout を挟み、同じなら挟まない', () => {
    // 来客判定(0.9: 発生しない) → 対象レーン(0.9 → lane2)の順で乱数を消費する
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const params = { ...baseParams, laneCount: 2, existingBranches: ['main', 'lane-10'] }

    const fromLane1 = createLaneAwarePullOrderPayload({ ...params, currentLane: 1 })
    expect(fromLane1.targetLaneOverride).toBe(2)
    expect(fromLane1.runtimeLogic.steps.map(s => s.displayCommand).slice(0, 2)).toEqual(['git status', 'git checkout lane-10'])

    const fromLane2 = createLaneAwarePullOrderPayload({ ...params, currentLane: 2 })
    expect(fromLane2.runtimeLogic.steps.map(s => s.displayCommand)).not.toContain('git checkout lane-10')
  })

  it('lane3 の注文は git log --oneline の受付確認から始まる', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const payload = createLaneAwarePullOrderPayload({ ...baseParams, laneCount: 3, existingBranches: ['main', 'x', 'y'], currentLane: 3 })
    expect(payload.runtimeLogic.steps[0].displayCommand).toBe('git log --oneline')
    expect(payload.runtimeLogic.steps.at(-1)?.displayCommand).toBe('git push origin y')
  })

  it('ギミック強制中は来客イベントを発生させず、指定ギミックの手順を組む', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    forceOrderEvent('amend')
    const payload = createLaneAwarePullOrderPayload({ ...baseParams, course: 2 })
    expect(payload.runtimeLogic.steps.map(s => s.type)).toEqual(['add', 'commit', 'add', 'amend', 'push'])
  })

  it('最初の手順にイベント告知がある注文は、受付時の告知にその内容を出す', () => {
    forceOrderEvent('bisect')
    const payload = createLaneAwarePullOrderPayload({ ...baseParams, course: 3 })
    expect(payload.runtimeLogic.steps[0].displayCommand).toBe('git bisect start')
    expect(payload.noticeTitle).toBe(`${NEW_ORDER_NOTICE}: スープがまずい！`)
    expect(payload.noticeDetails?.join('\n')).toContain('git bisect bad')
  })
})
