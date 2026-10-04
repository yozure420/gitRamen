import { describe, expect, it } from 'vitest'
import { getBranchLane, isCurrentStepMatch, normalizeCommand, toBranchListText } from '../../src/game/handleGameCommand/helpers'
import { buildStatusSnapshot } from '../../src/game/handleGameCommand/statusSnapshot'
import { makeRamen, standardSteps } from '../helpers/ramen'

describe('normalizeCommand', () => {
  it('全角スペース・連続スペース・大文字を正規化する', () => {
    expect(normalizeCommand('  Git　ADD   ネギ ')).toBe('git add ネギ')
  })
})

describe('getBranchLane', () => {
  const branches = ['main', 'lane-42', 'iekei']

  it('ブランチ名から 1 始まりのレーン番号を返す', () => {
    expect(getBranchLane('main', branches)).toBe(1)
    expect(getBranchLane('IEKEI', branches)).toBe(3)
  })

  it('laneN の別名は存在するレーンの範囲だけ受け付ける', () => {
    expect(getBranchLane('lane2', branches)).toBe(2)
    expect(getBranchLane('lane4', branches)).toBe(-1)
  })

  it('存在しないブランチは -1', () => {
    expect(getBranchLane('nope', branches)).toBe(-1)
  })

  it('一覧テキストはレーン番号付き', () => {
    expect(toBranchListText(['main', 'x'])).toBe('main(Lane 1), x(Lane 2)')
  })
})

describe('isCurrentStepMatch', () => {
  it('正規化済み入力が今の手順の expectedInputs に一致するか判定する', () => {
    const ramen = makeRamen(standardSteps())
    expect(isCurrentStepMatch(ramen, 'git add ネギ')).toBe(true)
    expect(isCurrentStepMatch(ramen, 'git add のり')).toBe(false)
    expect(isCurrentStepMatch(null, 'git add ネギ')).toBe(false)
  })
})

describe('buildStatusSnapshot', () => {
  it('具材なし → 投入済み未コミット → push 待ちの順に案内が変わる', () => {
    const ramen = makeRamen(standardSteps())
    expect(buildStatusSnapshot(ramen).phaseMessage).toContain('まだ具材が選ばれていません')
    expect(buildStatusSnapshot({ ...ramen, stagedItems: ['ネギ'] }).phaseMessage).toContain('git commit')
    expect(buildStatusSnapshot({ ...ramen, stagedItems: ['ネギ'], isCommitted: true }).phaseMessage).toContain('git push')
  })

  it('退避中・消失中の具材の状態を表示する', () => {
    const ramen = makeRamen(standardSteps())
    const stashed = buildStatusSnapshot({ ...ramen, isStashed: true, stashedItems: ['ネギ'] })
    expect(stashed.phaseMessage).toContain('git stash pop')
    expect(stashed.details).toContain('具材：[ネギ] (退避中)')

    const lost = buildStatusSnapshot({ ...ramen, isLost: true, lostItems: ['ネギ'] })
    expect(lost.phaseMessage).toContain('git reflog')
    expect(lost.details).toContain('具材：[ネギ] (消失)')
  })
})
