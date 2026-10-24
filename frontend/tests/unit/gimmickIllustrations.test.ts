import { describe, expect, it } from 'vitest'
import { GIMMICK_ILLUSTRATIONS } from '../../src/components/gmV2/gimmickIllustrations'
import type { GimmickIllustration } from '../../src/types/interface'

const ALL_KINDS: GimmickIllustration[] = ['stash', 'reset_soft', 'amend', 'reflog', 'bisect', 'bisect_culprit', 'plumbing']

describe('GIMMICK_ILLUSTRATIONS', () => {
  it('挿絵の種類は 7 種類ちょうどで過不足がない', () => {
    expect(Object.keys(GIMMICK_ILLUSTRATIONS).sort()).toEqual([...ALL_KINDS].sort())
  })

  it.each(ALL_KINDS)('%s には空でない画像 URL がある', (kind) => {
    expect(typeof GIMMICK_ILLUSTRATIONS[kind]).toBe('string')
    expect(GIMMICK_ILLUSTRATIONS[kind].length).toBeGreaterThan(0)
  })

  it('どの種類も別の画像を指している', () => {
    expect(new Set(Object.values(GIMMICK_ILLUSTRATIONS)).size).toBe(ALL_KINDS.length)
  })
})
