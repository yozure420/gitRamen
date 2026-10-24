import type { CommandStep } from '../../types/interface'
import { pickRandomLaneName } from './randomCatalog'
import { LANE_ARRIVAL_PROBABILITY, NEW_ORDER_NOTICE } from './constants'
import { buildCookingSteps, createOrderMeta, pickOrderEvent, readForcedOrderEvent } from './orderEvents'
import { createAddCommitWorkflow, createStep } from './stepFactory'
import type { CreateLaneAwarePullOrderParams, PullOrderPayload } from './types'

function createLaneSetupStep(targetLane: number): CommandStep | null {
  const setupStepByLane: Record<number, CommandStep | null> = {
    1: null,
    2: createStep({
      type: 'command',
      displayCommand: 'git status',
      logicLabel: 'Lane2 受付確認',
      logicDescription: 'Lane2 の注文票を確認してから調理に入る。',
      logicExample: '例: git status',
    }),
    3: createStep({
      type: 'command',
      displayCommand: 'git log --oneline',
      logicLabel: 'Lane3 受付確認',
      logicDescription: 'Lane3 は履歴確認をしてから調理に入る。',
      logicExample: '例: git log --oneline',
    }),
  }
  return setupStepByLane[targetLane]
}

function createPushStep(branchName: string): CommandStep {
  return createStep({
    type: 'push',
    displayCommand: `git push origin ${branchName}`,
    logicLabel: '配達完了',
    logicDescription: '調理したラーメンをプッシュしてお客さんに届ける。',
  })
}

export function createPullOrderPayload(course: number, _ramenId: number, baseCommandId: number): PullOrderPayload {
  const { baseRamen, topping, call } = createOrderMeta()
  const orderText = `${baseRamen}、トッピングは${topping}`
  const workflow = createAddCommitWorkflow({
    addCommand: `git add ${topping}`,
    addItem: topping,
    commitCommand: `git commit -m "${call}"`,
  })
  workflow.steps.push(createPushStep('main'))

  return {
    command: {
      id: baseCommandId,
      command: `git add ${topping}`,
      description: `${baseRamen}に${topping}を追加する注文`,
      game_note: orderText,
      course,
    },
    runtimeLogic: workflow,
    orderText,
  }
}

export function createLaneAwarePullOrderPayload(params: CreateLaneAwarePullOrderParams): PullOrderPayload {
  const { course, baseCommandId, laneCount, maxLanes, existingBranches, currentLane = 1 } = params
  const forcedEvent = readForcedOrderEvent(course)

  // 新規来客（ブランチ作成イベント）。ギミック強制中は発生させない
  if (!forcedEvent && laneCount < maxLanes && Math.random() < LANE_ARRIVAL_PROBABILITY) {
    let newBranchName = pickRandomLaneName()
    while (existingBranches.includes(newBranchName)) {
      newBranchName = pickRandomLaneName()
    }
    const meta = createOrderMeta()

    return {
      command: {
        id: baseCommandId,
        command: `git branch ${newBranchName}`,
        description: `新規来客レーン ${newBranchName} を開設する注文`,
        game_note: meta.call,
        course,
      },
      runtimeLogic: {
        steps: [
          createStep({
            type: 'command',
            displayCommand: `git branch ${newBranchName}`,
            logicLabel: '来客対応',
            logicDescription: '新しいお客さん用レーンを増設する。',
          }),
          createStep({
            type: 'command',
            displayCommand: `git checkout ${newBranchName}`,
            expectedInputs: [`git checkout ${newBranchName}`, `git switch ${newBranchName}`],
            logicLabel: 'レーン移動',
            logicDescription: '作成した新しいレーンに移動する。',
          }),
          ...buildCookingSteps('standard', { meta, laneLabel: `${newBranchName}レーン` }),
          createPushStep(newBranchName),
        ],
      },
      orderText: `${newBranchName}レーンご案内！${meta.baseRamen}${meta.topping}入り`,
      noticeTitle: '新規来客',
      noticeDetails: [`必要コマンド: git branch ${newBranchName}`],
      targetLaneOverride: 'startLane',
    }
  }

  // 既存レーンの注文
  const event = forcedEvent ?? pickOrderEvent(course)
  const targetLane = Math.floor(Math.random() * laneCount) + 1
  const targetBranchName = existingBranches[targetLane - 1] ?? `lane${targetLane}`
  const meta = createOrderMeta()
  const laneOrderText = `${targetBranchName}レーン: ${meta.baseRamen}、トッピングは${meta.topping}`

  const steps: CommandStep[] = []

  // 1. 準備ステップ (git status や git log --oneline)
  const maybeSetupStep = createLaneSetupStep(targetLane)
  if (maybeSetupStep) steps.push(maybeSetupStep)

  // 目的地のレーン（targetLane）と、現在プレイヤーがいるレーン（currentLane）が異なる場合のみ checkout 指示を挟む
  if (targetLane !== currentLane) {
    steps.push(createStep({
      type: 'command',
      displayCommand: `git checkout ${targetBranchName}`,
      expectedInputs: [`git checkout ${targetBranchName}`, `git switch ${targetBranchName}`],
      logicLabel: 'レーン移動',
      logicDescription: `現在地から ${targetBranchName} レーンに移動する。`,
    }))
  }

  // 2. 調理（コースに応じたギミック込み）・配達
  steps.push(...buildCookingSteps(event, { meta, laneLabel: `${targetBranchName}レーン` }))
  steps.push(createPushStep(targetBranchName))

  return {
    command: {
      id: baseCommandId,
      command: steps[0].displayCommand,
      description: `${targetBranchName}レーンの注文`,
      game_note: laneOrderText,
      course,
    },
    runtimeLogic: { steps },
    orderText: laneOrderText,
    noticeTitle: NEW_ORDER_NOTICE,
    noticeDetails: [`対象: ${targetBranchName}レーン`, `最初のコマンド: ${steps[0].displayCommand}`],
    targetLaneOverride: targetLane,
  }
}
