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

export function createPullOrderPayload(course: number, _ramenId: number, baseCommandId: number): PullOrderPayload {
  const { baseRamen, topping, call } = createRamenOrderMeta()
  const orderText = `${baseRamen}、トッピングは${topping}`

  return {
    command: {
      id: baseCommandId,
      command: `git add ${topping}`,
      description: `${baseRamen}に${topping}を追加する注文`,
      game_note: orderText,
      course,
    },
    runtimeLogic: createAddCommitWorkflow({
      addCommand: `git add ${topping}`,
      addItem: topping,
      commitCommand: `git commit -m "${call}"`,
    }),
    orderText,
  }
}

export function createLaneAwarePullOrderPayload(params: CreateLaneAwarePullOrderParams): PullOrderPayload {
  const { course, baseCommandId, laneCount, maxLanes, existingBranches } = params

  // 新規来客（ブランチ作成イベント）
  if (laneCount < maxLanes && Math.random() < LANE_ARRIVAL_PROBABILITY) {
    let newBranchName = pickRandomLaneName()
    while (existingBranches.includes(newBranchName)) {
      newBranchName = pickRandomLaneName()
    }
    const { baseRamen, topping, call } = createRamenOrderMeta() // 👈 何ラーメンかを最初から取得
    
    return {
      command: {
        id: baseCommandId,
        command: `git branch ${newBranchName}`,
        description: `新規来客レーン ${newBranchName} を開設する注文`,
        game_note: `${baseRamen}${topping}入りおまち！`, // 👈 ここにラーメン名をセットして画像を安定させる！
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
          // 👇 ここに git checkout を追加！
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

  const addStep = createStep({
    type: 'add',
    displayCommand: `git add ${topping}`,
    logicLabel: `${targetBranchName}レーン調理`,
    logicDescription: `${targetBranchName}レーン注文の具材「${topping}」を投入。`,
    itemName: topping,
  })

  const commitStep = createStep({
    type: 'commit',
    displayCommand: `git commit -m "${call}"`,
    logicLabel: `${targetBranchName}レーン確定`,
    logicDescription: `${targetBranchName}レーン注文をコミットで確定する。`,
  })

  const maybeSetupStep = createLaneSetupStep(targetLane)
  const steps = maybeSetupStep ? [maybeSetupStep, addStep, commitStep] : [addStep, commitStep]

  return {
    command: {
      id: baseCommandId,
      command: addStep.displayCommand,
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