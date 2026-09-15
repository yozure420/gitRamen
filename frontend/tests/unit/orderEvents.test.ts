import { afterEach, describe, expect, it } from 'vitest'
import {
  buildCookingSteps,
  createFakeHash,
  createOrderMeta,
  getAvailableOrderEvents,
  pickOrderEvent,
  readForcedOrderEvent,
} from '../../src/game/commandLogic/orderEvents'
import type { OrderEventType } from '../../src/game/commandLogic/types'
import { forceOrderEvent } from '../helpers/gameHarness'

const meta = { baseRamen: '味噌ラーメン', topping: 'ネギ', call: '味噌ラーメンネギ入りおまち！' }
const build = (event: OrderEventType) => buildCookingSteps(event, { meta, laneLabel: 'mainレーン', branchName: 'main' })

afterEach(() => forceOrderEvent(null))

describe('getAvailableOrderEvents', () => {
  it('初級は通常注文のみ', () => {
    expect(getAvailableOrderEvents(1)).toEqual(['standard'])
  })

  it('上位コースほどギミックが増え、下位コースのギミックも引き継ぐ', () => {
    expect(getAvailableOrderEvents(2)).toEqual(['standard', 'stash', 'reset_soft', 'amend'])
    expect(getAvailableOrderEvents(3)).toEqual(expect.arrayContaining(['stash', 'reset_soft', 'amend', 'reflog', 'bisect']))
    expect(getAvailableOrderEvents(4)).toEqual(expect.arrayContaining(['stash', 'reflog', 'bisect', 'plumbing']))
    expect(getAvailableOrderEvents(3)).not.toContain('plumbing')
  })

  it('定義のないコースは直近下位コースの設定を使う', () => {
    expect(getAvailableOrderEvents(9)).toEqual(getAvailableOrderEvents(4))
  })
})

describe('pickOrderEvent', () => {
  it('初級は常に通常注文', () => {
    expect(pickOrderEvent(1, () => 0)).toBe('standard')
    expect(pickOrderEvent(1, () => 0.99)).toBe('standard')
  })

  it('中級は乱数の区間でギミックを振り分ける', () => {
    expect(pickOrderEvent(2, () => 0.1)).toBe('stash')
    expect(pickOrderEvent(2, () => 0.3)).toBe('reset_soft')
    expect(pickOrderEvent(2, () => 0.5)).toBe('amend')
    expect(pickOrderEvent(2, () => 0.7)).toBe('standard')
  })

  it('超上級では plumbing が出題される', () => {
    const seen = new Set<OrderEventType>()
    for (let roll = 0; roll < 1; roll += 0.01) seen.add(pickOrderEvent(4, () => roll))
    expect(seen).toContain('plumbing')
    expect(seen).toContain('standard')
  })
})

describe('readForcedOrderEvent', () => {
  it('強制指定がなければ null', () => {
    expect(readForcedOrderEvent(2)).toBeNull()
  })

  it('そのコースで出題可能なギミックだけを受け付ける', () => {
    forceOrderEvent('amend')
    expect(readForcedOrderEvent(2)).toBe('amend')
    expect(readForcedOrderEvent(1)).toBeNull()

    forceOrderEvent('plumbing')
    expect(readForcedOrderEvent(3)).toBeNull()
    expect(readForcedOrderEvent(4)).toBe('plumbing')
  })
})

describe('buildCookingSteps', () => {
  const types = (event: OrderEventType) => build(event).map(step => step.type)

  it('通常注文は add → commit', () => {
    expect(types('standard')).toEqual(['add', 'commit'])
  })

  it('stash: add → stash → 割り込み add/commit → stash pop → commit', () => {
    const steps = build('stash')
    expect(steps.map(s => s.type)).toEqual(['add', 'stash', 'add', 'commit', 'stash_pop', 'commit'])
    expect(steps[1].eventNotice?.title).toBe('常連さんの割り込み！')
    expect(steps[2].itemName).not.toBe(meta.topping)
    expect(steps.at(-1)?.displayCommand).toBe(`git commit -m "${meta.call}"`)
  })

  it('reset_soft: 言い間違い commit の後に reset --soft と正しい commit', () => {
    const steps = build('reset_soft')
    expect(steps.map(s => s.type)).toEqual(['add', 'commit', 'reset_soft', 'commit'])
    expect(steps[1].displayCommand).not.toContain(meta.baseRamen)
    expect(steps[2].expectedInputs).toContain('git reset --soft HEAD^')
  })

  it('amend: commit の後に注文変更の add と amend', () => {
    const steps = build('amend')
    expect(steps.map(s => s.type)).toEqual(['add', 'commit', 'add', 'amend'])
    expect(steps[2].eventNotice?.title).toBe('注文変更！')
    expect(steps[3].expectedInputs).toContain('git commit --amend --no-edit')
  })

  it('reflog: reflog 手順に入った瞬間に丼が消え、reset --hard HEAD@{1} で復元する', () => {
    const steps = build('reflog')
    expect(steps.map(s => s.type)).toEqual(['add', 'commit', 'command', 'reset_hard_restore'])
    expect(steps[2]).toMatchObject({ displayCommand: 'git reflog', onEnter: 'drop_bowl' })
    expect(steps[3].displayCommand).toBe('git reset --hard HEAD@{1}')
  })

  it('bisect: start → bad → good <hash> → reset の後に調理', () => {
    const steps = build('bisect')
    expect(steps.map(s => s.displayCommand.replace(/[0-9a-f]{7}$/, '<hash>'))).toEqual([
      'git bisect start', 'git bisect bad', 'git bisect good <hash>', 'git bisect reset', `git add ${meta.topping}`, `git commit -m "${meta.call}"`,
    ])
    expect(steps[0].eventNotice).toBeDefined()
  })

  it('plumbing: write-tree → commit-tree → update-ref（ブランチ名を反映）', () => {
    const steps = buildCookingSteps('plumbing', { meta, laneLabel: 'lane-12レーン', branchName: 'lane-12' })
    expect(steps.map(s => s.type)).toEqual(['add', 'command', 'commit_tree', 'update_ref'])
    const treeHash = steps[2].displayCommand.split(' ')[2]
    expect(steps[1].eventNotice?.details.join('\n')).toContain(treeHash)
    expect(steps[3].displayCommand).toMatch(/^git update-ref refs\/heads\/lane-12 [0-9a-f]{7}$/)
  })
})

describe('createOrderMeta / createFakeHash', () => {
  it('コールはベースラーメンと具材から組み立てる', () => {
    const created = createOrderMeta()
    expect(created.call).toBe(`${created.baseRamen}${created.topping}入りおまち！`)
  })

  it('ハッシュは7桁の16進数', () => {
    for (let i = 0; i < 50; i++) expect(createFakeHash()).toMatch(/^[0-9a-f]{7}$/)
  })
})
