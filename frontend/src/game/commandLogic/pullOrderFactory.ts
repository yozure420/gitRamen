import type { CommandStep } from '../../types/interface'
import { pickRandomBaseRamen, pickRandomLaneName, pickRandomTopping } from './randomCatalog'
import { LANE_ARRIVAL_PROBABILITY, NEW_CUSTOMER_NOTICE, NEW_ORDER_NOTICE } from './constants'
import { createAddCommitWorkflow, createStep } from './stepFactory'
import type { CreateLaneAwarePullOrderParams, PullOrderPayload } from './types'

function createRamenOrderMeta() {
  const baseRamen = pickRandomBaseRamen()
  const topping = pickRandomTopping()
  const call = `${baseRamen}${topping}入りおまち！`
  return { baseRamen, topping, call }
}

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
  const { baseRamen, topping, call } = createRamenOrderMeta()
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

// 👇 拡張パラメータの型定義（TSエラー防止）
type ExtendedParams = CreateLaneAwarePullOrderParams & { currentLane?: number }

export function createLaneAwarePullOrderPayload(params: ExtendedParams): PullOrderPayload {
  const { course, baseCommandId, laneCount, maxLanes, existingBranches, currentLane = 1 } = params

  // 新規来客（ブランチ作成イベント）
  if (laneCount < maxLanes && Math.random() < LANE_ARRIVAL_PROBABILITY) {
    let newBranchName = pickRandomLaneName()
    while (existingBranches.includes(newBranchName)) {
      newBranchName = pickRandomLaneName()
    }
    const { baseRamen, topping, call } = createRamenOrderMeta()
    
    return {
      command: {
        id: baseCommandId,
        command: `git branch ${newBranchName}`,
        description: `新規来客レーン ${newBranchName} を開設する注文`,
        game_note: `${baseRamen}${topping}入りおまち！`,
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
            logicLabel: 'レーン移動',
            logicDescription: '作成した新しいレーンに移動する。',
          }),
          createStep({
            type: 'add',
            displayCommand: `git add ${topping}`,
            logicLabel: '具材投入',
            logicDescription: `具材「${topping}」をステージに載せる。`,
            itemName: topping,
          }),
          createStep({
            type: 'commit',
            displayCommand: `git commit -m "${call}"`,
            logicLabel: 'コール',
            logicDescription: '注文内容を確定する。',
          }),
          createPushStep(newBranchName)
        ],
      },
      orderText: `${newBranchName}レーンご案内！${baseRamen}${topping}入り`,
      noticeTitle: '新規来客',
      noticeDetails: [`必要コマンド: git branch ${newBranchName}`],
      targetLaneOverride: 'startLane',
    }
  }

  // 既存レーンの注文
  const targetLane = Math.floor(Math.random() * laneCount) + 1
  const targetBranchName = existingBranches[targetLane - 1] ?? `lane${targetLane}`
  const { baseRamen, topping, call } = createRamenOrderMeta()
  const laneOrderText = `${targetBranchName}レーン: ${baseRamen}、トッピングは${topping}`

  const steps: CommandStep[] = []

  // 1. 準備ステップ (git status や git log --oneline)
  const maybeSetupStep = createLaneSetupStep(targetLane)
  if (maybeSetupStep) steps.push(maybeSetupStep)

  // 👇 修正：目的地のレーン（targetLane）と、現在プレイヤーがいるレーン（currentLane）が異なる場合のみ checkout 指示を挟む！
  if (targetLane !== currentLane) {
    steps.push(createStep({
      type: 'command',
      displayCommand: `git checkout ${targetBranchName}`,
      logicLabel: 'レーン移動',
      logicDescription: `現在地から ${targetBranchName} レーンに移動する。`,
    }))
  }

  // 2. 具材投入・確定・配達
  steps.push(createStep({
    type: 'add',
    displayCommand: `git add ${topping}`,
    logicLabel: `${targetBranchName}レーン調理`,
    logicDescription: `${targetBranchName}レーン注文の具材「${topping}」を投入。`,
    itemName: topping,
  }))

  steps.push(createStep({
    type: 'commit',
    displayCommand: `git commit -m "${call}"`,
    logicLabel: `${targetBranchName}レーン確定`,
    logicDescription: `${targetBranchName}レーン注文をコミットで確定する。`,
  }))

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