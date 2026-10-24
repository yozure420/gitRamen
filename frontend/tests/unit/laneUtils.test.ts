import { describe, expect, it, vi } from 'vitest'
import { clampLane, resolveTargetLane } from '../../src/game/gameEngin/laneUtils'

describe('resolveTargetLane', () => {
  const base = { firstStep: undefined, startLane: 2, laneCount: 2 }

  it('startLane 指定は開始レーン', () => {
    expect(resolveTargetLane({ ...base, targetLaneOverride: 'startLane' })).toBe(2)
  })

  it('newLane 指定は、これから開設されるレーン（現在のレーン数 + 1）', () => {
    expect(resolveTargetLane({ ...base, targetLaneOverride: 'newLane' })).toBe(3)
  })

  it('数値指定は存在するレーンの範囲に収める', () => {
    expect(resolveTargetLane({ ...base, targetLaneOverride: 5 })).toBe(2)
    expect(resolveTargetLane({ ...base, targetLaneOverride: 1 })).toBe(1)
  })

  it('指定がなければランダムなレーン', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    expect(resolveTargetLane(base)).toBe(2)
  })
})

describe('clampLane', () => {
  it('1〜laneCount に収める', () => {
    expect(clampLane(0, 3)).toBe(1)
    expect(clampLane(4, 3)).toBe(3)
  })
})
