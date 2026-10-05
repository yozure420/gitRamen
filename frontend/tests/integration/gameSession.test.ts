import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OrderEventType } from '../../src/game/commandLogic/types'
import { createGameHarness, forceOrderEvent } from '../helpers/gameHarness'

afterEach(() => forceOrderEvent(null))

/** git pull → 伝票どおりに入力 → 到着判定 までを1杯分こなす */
function serveOneOrder(harness: ReturnType<typeof createGameHarness>) {
  harness.run('git pull')
  const ramen = harness.active()
  if (!ramen) throw new Error(`pull failed: ${harness.state.message}`)
  harness.playActiveOrder()
  return { ramen, outcome: harness.deliverActive() }
}

describe('ゲーム通し: 各コースのギミック注文を手順どおり捌くと配達成功する', () => {
  const cases: Array<[number, OrderEventType]> = [
    [1, 'standard'],
    [2, 'stash'],
    [2, 'reset_soft'],
    [2, 'amend'],
    [3, 'reflog'],
    [3, 'bisect'],
    [4, 'plumbing'],
  ]

  it.each(cases)('course=%i / %s', (course, event) => {
    forceOrderEvent(event)
    const harness = createGameHarness(course)

    const { outcome } = serveOneOrder(harness)

    expect(harness.state.misses).toEqual([])
    expect(outcome).toMatchObject({ result: 'delivered', scoreDelta: 100 * course })
  })
})

describe('ゲーム通し: ランダム注文を連続で捌いても詰まらない', () => {
  it.each([1, 2, 3, 4])('course=%i で 40 杯連続配達できる', (course) => {
    const harness = createGameHarness(course)

    for (let i = 0; i < 40; i++) {
      const { ramen, outcome } = serveOneOrder(harness)
      expect(outcome.result, `order #${i}: ${ramen.steps.map(s => s.displayCommand).join(' / ')}`).toBe('delivered')
    }

    expect(harness.state.misses).toEqual([])
    expect(harness.state.existingBranches.length).toBeLessThanOrEqual(3)
  })
})

describe('ゲーム通し: 来客イベントでレーンが増える', () => {
  it('git branch → checkout で新レーンを開設して、そのレーンに配達できる', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const harness = createGameHarness(1)

    const { outcome } = serveOneOrder(harness)

    expect(outcome.result).toBe('delivered')
    expect(harness.state.existingBranches).toEqual(['main', 'lane-10'])
    expect(harness.state.laneCount).toBe(2)
  })
})

describe('ゲーム通し: ギミックの誤操作', () => {
  it('イベント告知は該当手順に入ったタイミングで伝票ウィンドウに出る', () => {
    forceOrderEvent('stash')
    const harness = createGameHarness(2)
    harness.run('git pull')
    harness.state.statusWindowTitles = []

    const [addStep] = harness.active()!.steps
    harness.run(addStep.displayCommand)

    expect(harness.state.statusWindowTitles).toEqual(['常連さんの割り込み！'])
  })

  it('stash: 退避前に stash pop するとミス、stash pop を忘れて push すると手順未完了で失敗', () => {
    forceOrderEvent('stash')
    const harness = createGameHarness(2)
    harness.run('git pull')
    const steps = harness.active()!.steps

    harness.run(steps[0].displayCommand)
    harness.run('git stash pop')
    expect(harness.state.misses).toHaveLength(1)
    expect(harness.active()!.currentStepIndex).toBe(1)

    harness.run('git stash')
    expect(harness.active()).toMatchObject({ isStashed: true, stagedItems: [] })
    harness.run('git stash list')
    expect(harness.state.message).toContain(steps[0].itemName)

    harness.run(steps[2].displayCommand)
    harness.run(steps[3].displayCommand)
    harness.run(steps.at(-1)!.displayCommand) // stash pop を飛ばして push
    expect(harness.state.misses).toHaveLength(2)
    expect(harness.deliverActive()).toMatchObject({ result: 'failed', errorLabel: '手順未完了' })
  })

  it('reset_soft: reset するとコミットだけ取り消され、具材は残る', () => {
    forceOrderEvent('reset_soft')
    const harness = createGameHarness(2)
    harness.run('git pull')
    const steps = harness.active()!.steps

    harness.run(steps[0].displayCommand)
    harness.run(steps[1].displayCommand)
    harness.run('git reset --soft HEAD~1')

    expect(harness.active()).toMatchObject({ isCommitted: false, stagedItems: [steps[0].itemName] })
  })

  it('amend: 注文変更で普通の commit を打つとミスになり手順は進まない', () => {
    forceOrderEvent('amend')
    const harness = createGameHarness(2)
    harness.run('git pull')
    const steps = harness.active()!.steps

    steps.slice(0, 3).forEach(step => harness.run(step.displayCommand))
    harness.run('git commit -m "別の丼"')

    expect(harness.state.misses).toHaveLength(1)
    expect(harness.state.message).toContain('--amend')
    expect(harness.active()!.currentStepIndex).toBe(3)

    harness.run('git commit --amend -m "上書き"')
    expect(harness.active()!.currentStepIndex).toBe(4)
  })

  it('amend: 注文変更を無視して push すると手順未完了で失敗', () => {
    forceOrderEvent('amend')
    const harness = createGameHarness(2)
    harness.run('git pull')
    const steps = harness.active()!.steps

    steps.slice(0, 2).forEach(step => harness.run(step.displayCommand))
    harness.run(steps.at(-1)!.displayCommand)

    expect(harness.deliverActive()).toMatchObject({ result: 'failed', errorLabel: '手順未完了' })
  })

  it('reflog: 丼が消えたまま push すると空振りプッシュ', () => {
    forceOrderEvent('reflog')
    const harness = createGameHarness(3)
    harness.run('git pull')
    const steps = harness.active()!.steps

    steps.slice(0, 2).forEach(step => harness.run(step.displayCommand))
    expect(harness.active()).toMatchObject({ isLost: true, isCommitted: false })

    harness.run(steps.at(-1)!.displayCommand)
    expect(harness.deliverActive()).toMatchObject({ result: 'failed', errorLabel: '空振りプッシュ' })
  })

  it('reflog: 復元コマンドを reflog より先に打つと順番違いのミス', () => {
    forceOrderEvent('reflog')
    const harness = createGameHarness(3)
    harness.run('git pull')
    const steps = harness.active()!.steps

    steps.slice(0, 2).forEach(step => harness.run(step.displayCommand))
    harness.run('git reset --hard HEAD@{1}')

    expect(harness.state.misses).toHaveLength(1)
    expect(harness.active()!.isLost).toBe(true)
  })

  it('bisect: good のハッシュが違うとミス', () => {
    forceOrderEvent('bisect')
    const harness = createGameHarness(3)
    harness.run('git pull')

    harness.run('git bisect start')
    harness.run('git bisect bad HEAD')
    harness.run('git bisect good 0000000')

    expect(harness.state.misses).toHaveLength(1)
    expect(harness.active()!.currentStepIndex).toBe(2)
  })

  it('plumbing: commit-tree のツリー違い・update-ref の貼り先違い・普通の commit はミス', () => {
    forceOrderEvent('plumbing')
    const harness = createGameHarness(4)
    harness.run('git pull')
    const steps = harness.active()!.steps

    harness.run(steps[0].displayCommand)
    harness.run('git commit -m "楽をする"')
    expect(harness.state.misses).toHaveLength(1)

    harness.run(steps[1].displayCommand)
    harness.run('git commit-tree abcdef0 -p HEAD -m "違うツリー"')
    expect(harness.state.misses).toHaveLength(2)

    const treeHash = steps[2].displayCommand.split(' ')[2]
    harness.run(`git commit-tree ${treeHash} -p HEAD -m "メッセージは自由"`)
    expect(harness.active()!.currentStepIndex).toBe(3)

    harness.run(steps[3].displayCommand.replace('refs/heads/main', 'refs/heads/other'))
    expect(harness.state.misses).toHaveLength(3)
    expect(harness.active()!.isCommitted).toBe(false)

    harness.run(steps[3].displayCommand)
    expect(harness.active()!.isCommitted).toBe(true)
  })

  it('初級では中級以上のギミックコマンドは手順外としてミスになる', () => {
    forceOrderEvent('standard')
    const harness = createGameHarness(1)
    harness.run('git pull')

    harness.run('git stash')

    expect(harness.state.misses).toHaveLength(1)
    expect(harness.active()!.isStashed).toBe(false)
  })
})

describe('ゲーム通し: git status の伝票の自動クローズ', () => {
  afterEach(() => vi.useRealTimers())

  it('git status の伝票は一定時間で閉じる', () => {
    vi.useFakeTimers()
    const harness = createGameHarness(1)

    harness.run('git status')
    expect(harness.state.statusWindow?.title).toBe('伝票 / git status')

    vi.advanceTimersByTime(3000)
    expect(harness.state.statusWindow).toBeNull()
  })

  it('git status のあとに出たギミックの告知は、自動クローズで閉じない', () => {
    vi.useFakeTimers()
    forceOrderEvent('stash')
    const harness = createGameHarness(2)
    harness.run('git pull')
    const [addStep] = harness.active()!.steps

    harness.run('git status')
    harness.run(addStep.displayCommand)
    expect(harness.state.statusWindow?.title).toBe('常連さんの割り込み！')

    vi.advanceTimersByTime(3000)
    expect(harness.state.statusWindow?.title).toBe('常連さんの割り込み！')
  })
})
