import type { Dispatch, SetStateAction } from 'react'
import type { Command, CommandHistory, Ramen, StatusWindowData } from '../types/interface'
import { advanceWorkflow, getCurrentCommandStep } from './gameEngine'

export function normalizeCommand(input: string): string {
  return input
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

type ExecuteGameCommandParams = {
  cmd: string
  normalizedCmd: string
  isGameOver: boolean
  course: number
  existingBranches: string[]
  showHelp: boolean
  availableCommands: Command[]
  availableItems: string[]
  maxLanes: number
  pushSpeed: number
  onPullOrder: () => string
  getActiveRamen: () => Ramen | null
  setInputCommand: (value: string) => void
  setCommandHistory: Dispatch<SetStateAction<CommandHistory[]>>
  setMessage: (value: string) => void
  setRamens: Dispatch<SetStateAction<Ramen[]>>
  setScore: Dispatch<SetStateAction<number>>
  setShowHelp: (value: boolean) => void
  setShowLog: (value: boolean) => void
  setIsCompactLog: (value: boolean) => void
  setLaneCount: (value: number) => void
  setExistingBranches: Dispatch<SetStateAction<string[]>>
  setIsPaused: (value: boolean) => void
  setStatusWindow: Dispatch<SetStateAction<StatusWindowData | null>>
  recordMissByCommandId: (commandId: number) => void
}

export function executeGameCommand(params: ExecuteGameCommandParams): void {
  const {
    cmd,
    normalizedCmd,
    isGameOver,
    course,
    existingBranches,
    showHelp,
    availableCommands,
    availableItems,
    maxLanes,
    pushSpeed,
    onPullOrder,
    getActiveRamen,
    setInputCommand,
    setCommandHistory,
    setMessage,
    setRamens,
    setScore,
    setShowHelp,
    setShowLog,
    setIsCompactLog,
    setLaneCount,
    setExistingBranches,
    setIsPaused,
    setStatusWindow,
    recordMissByCommandId,
  } = params

  if (!cmd.trim() || isGameOver) return

  setCommandHistory(prev => [...prev, { command: cmd, timestamp: new Date() }])

  const activeRamen = getActiveRamen()
  const currentStep = activeRamen ? getCurrentCommandStep(activeRamen) : null

  if (normalizedCmd === 'git pull') {
    if (activeRamen) {
      setMessage('⚠️ 既に調理中の注文があります。先にこの一杯を届けてください')
      setInputCommand('')
      return
    }

    const pullMessage = onPullOrder()
    setMessage(pullMessage)
    setInputCommand('')
    return
  }

  const isCurrentStepMatch = (ramen: Ramen | null, input: string): boolean => {
    const step = ramen ? getCurrentCommandStep(ramen) : null
    return step?.expectedInputs.some(expected => normalizeCommand(expected) === input) ?? false
  }

  const getNextStepCommand = (ramen: Ramen): string | null => {
    return ramen.steps[ramen.currentStepIndex + 1]?.displayCommand ?? null
  }

  const getBranchLane = (branchName: string): number => {
    const laneAliasMatch = normalizeCommand(branchName).match(/^lane([1-9]\d*)$/)
    if (laneAliasMatch) {
      const laneFromAlias = Number(laneAliasMatch[1])
      if (laneFromAlias >= 1 && laneFromAlias <= existingBranches.length) {
        return laneFromAlias
      }
    }

    const branchIndex = existingBranches.findIndex((branch) => normalizeCommand(branch) === normalizeCommand(branchName))
    return branchIndex >= 0 ? branchIndex + 1 : -1
  }

  const toBranchListText = (): string => {
    return existingBranches
      .map((branch, index) => `${branch}(Lane ${index + 1})`)
      .join(', ')
  }

  const applyLaneSwitchWithoutStepAdvance = (ramen: Ramen, lane: number) => {
    setRamens(prev => prev.map((current) => {
      if (current.id !== ramen.id) return current
      return { ...current, currentLane: lane }
    }))
  }

  const completeCurrentStep = (ramen: Ramen, options?: {
    scoreDelta?: number
    message: string
    update?: (current: Ramen) => Partial<Ramen>
  }) => {
    const { scoreDelta = 50 * course, message, update } = options ?? { message: '' }

    if (scoreDelta !== 0) {
      setScore(prev => prev + scoreDelta)
    }

    setRamens(prev => prev.map(current => {
      if (current.id !== ramen.id) return current
      const nextState = advanceWorkflow(current, {
        commandsExecuted: current.commandsExecuted + 1,
        ...(update ? update(current) : {}),
      })
      return nextState
    }))

    setMessage(message)
    setInputCommand('')
  }

  const recordMiss = (ramen?: Ramen | null) => {
    const target = ramen ?? activeRamen
    if (!target?.command?.id) return
    recordMissByCommandId(target.command.id)
  }

  const rejectOutOfOrder = (stepType: 'add' | 'commit' | 'push') => {
    if (!currentStep) return false
    if (currentStep.type === stepType) return false

    recordMiss(activeRamen)

    if (stepType === 'add') {
      setMessage(`❌ まだ add の番ではありません。今は「${currentStep.displayCommand}」です`)
    } else if (stepType === 'commit') {
      setMessage(`❌ まだ commit できません。先に「${currentStep.displayCommand}」を完了してください`)
    } else {
      setMessage(`❌ まだ push できません。先に「${currentStep.displayCommand}」を完了してください`)
    }

    setInputCommand('')
    return true
  }

  if (cmd.match(/^git clone .+$/i)) {
    // recordMiss(activeRamen)
    setMessage('⛔ git clone はゲーム開始前の難易度選択専用です')
    setInputCommand('')
    return
  }

  const addMatch = cmd.match(/^git add (.+)$/i)
  if (addMatch) {
    if (!activeRamen) {
      // recordMiss(activeRamen)
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    if (rejectOutOfOrder('add')) return

    const item = addMatch[1].trim()
    const nextStep = getNextStepCommand(activeRamen)

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      recordMiss(activeRamen)
      setMessage(`❌ 今必要なのは「${currentStep?.displayCommand ?? ''}」です`)
      setInputCommand('')
      return
    }

    if (item === '.') {
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `✅ 全マシ全のせ！ 次: ${nextStep}`
          : '✅ 全マシ全のせ！',
        update: () => ({ stagedItems: [...availableItems] }),
      })
    } else if (availableItems.includes(item)) {
      if (activeRamen.stagedItems.includes(item)) {
        setMessage(`⚠️ ${item}は既に追加されています`)
        setInputCommand('')
        return
      }

      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `✅ ${item}を追加しました。次: ${nextStep}`
          : `✅ ${item}を追加しました`,
        update: (current) => ({ stagedItems: [...current.stagedItems, item] }),
      })
    } else {
      recordMiss(activeRamen)
      setMessage(`❌ ${item}という具材はありません`)
      setInputCommand('')
    }
    return
  }

  const commitMatch = cmd.match(/^git commit -m "(.+)"$/i)
  if (commitMatch) {
    if (!activeRamen) {
      // recordMiss(activeRamen)
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    if (rejectOutOfOrder('commit')) return

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      recordMiss(activeRamen)
      setMessage(`❌ 今必要な commit は「${currentStep?.displayCommand ?? ''}」です`)
      setInputCommand('')
      return
    }

    const callText = commitMatch[1]
    const nextStep = getNextStepCommand(activeRamen)
    completeCurrentStep(activeRamen, {
      message: nextStep
        ? `🍜 ${callText} 次: ${nextStep}`
        : `🍜 ${callText}`,
      update: () => ({ isCommitted: true }),
    })
    return
  }

  const checkoutBranchMatch = cmd.match(/^git checkout -b (.+)$/i)
  if (checkoutBranchMatch) {
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    const branchName = checkoutBranchMatch[1].trim()
    if (!branchName) {
      recordMiss(activeRamen)
      setMessage('❌ ブランチ名を入力してください')
      setInputCommand('')
      return
    }

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
    recordMiss(activeRamen)
    setMessage(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
    setInputCommand('')
    return
    }

    if (getBranchLane(branchName) > 0) {
      recordMiss(activeRamen)
      setMessage(`❌ ${branchName} は既に存在します`)
      setInputCommand('')
      return
    }

    if (existingBranches.length >= maxLanes) {
      recordMiss(activeRamen)
      setMessage(`ℹ️ 既に最大レーン数（${maxLanes}）です。既存ブランチへ checkout してください`)
      setInputCommand('')
      return
    }

    const nextBranches = [...existingBranches, branchName]
    const nextLane = nextBranches.length
    setExistingBranches(nextBranches)
    setLaneCount(nextLane)

    if (isCurrentStepMatch(activeRamen, normalizedCmd)) {
      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `🆕 ${branchName} を作成して Lane ${nextLane} へ切替。次: ${nextStep}`
          : `🆕 ${branchName} を作成して Lane ${nextLane} へ切替`,
        update: () => ({ currentLane: nextLane }),
      })
      return
    }

    applyLaneSwitchWithoutStepAdvance(activeRamen, nextLane)
    setMessage(`🔀 ${branchName} を作成して Lane ${nextLane} へ切り替えました`)
    setInputCommand('')
    return
  }

  const switchMatch = cmd.match(/^git (switch|checkout) (.+)$/i)
  if (switchMatch) {
    const branchName = switchMatch[2].trim()
    const targetLane = getBranchLane(branchName)

    if (targetLane <= 0) {
      recordMiss(activeRamen)
      setMessage(`❌ ${branchName} は存在しません。既存: ${toBranchListText()}`)
      setInputCommand('')
      return
    }

    if (!activeRamen) {
      // recordMiss(activeRamen)
      setMessage('❌ 移動できるラーメンがありません')
      setInputCommand('')
      return
    }
    // ワークフローに沿っているなら、ステップを進める。
    if (isCurrentStepMatch(activeRamen, normalizedCmd)) {
      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `🔀 ${branchName} (Lane ${targetLane}) へ切替。次: ${nextStep}`
          : `🔀 ${branchName} (Lane ${targetLane}) へ切替`,
        update: () => ({ currentLane: targetLane }),
      })
      return
    }
    // ワークフローに沿っていなくても、移動したいならさせてやる。
    applyLaneSwitchWithoutStepAdvance(activeRamen, targetLane)
    setMessage(`🔀 ${branchName} (Lane ${targetLane}) へ切り替えました`)
    setInputCommand('')
    return
  }

  if (normalizedCmd === 'git branch') {
    const laneList = toBranchListText()
    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `🌿 現在のレーン: ${laneList}。次: ${nextStep}`
          : `🌿 現在のレーン: ${laneList}`,
      })
    } else {
      setMessage(`🌿 現在のレーン: ${laneList}`)
      setInputCommand('')
    }
    return
  }

  const branchMatch = cmd.match(/^git branch (.+)$/i)
  if (branchMatch) {
    const branchName = branchMatch[1].trim()
    if (!branchName) {
      recordMiss(activeRamen)
      setMessage('❌ ブランチ名を入力してください')
      setInputCommand('')
      return
    }

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
    recordMiss(activeRamen)
    setMessage(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
    setInputCommand('')
    return
  }

    if (getBranchLane(branchName) > 0) {
      setMessage(`ℹ️ ${branchName} は既に存在します`)
      setInputCommand('')
      return
    }

    if (existingBranches.length >= maxLanes) {
      setMessage(`ℹ️ 既に最大レーン数（${maxLanes}）です`)
      setInputCommand('')
      return
    }

    const nextBranches = [...existingBranches, branchName]
    const nextLane = nextBranches.length
    setExistingBranches(nextBranches)
    setLaneCount(nextLane)

    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `🆕 ${branchName} (Lane ${nextLane}) を開設。次: ${nextStep}`
          : `🆕 ${branchName} (Lane ${nextLane}) を開設`,
      })
      return
    }

    setMessage(`🆕 ${branchName} (Lane ${nextLane}) を開設しました`)
    setInputCommand('')
    return
  }

  if (normalizedCmd === 'git help') {
    const nextShow = !showHelp
    setShowHelp(nextShow)
    setIsPaused(nextShow)
    setMessage(nextShow ? '💡 ヒントを表示（一時停止中）' : 'ヒントを非表示')
    setInputCommand('')
    return
  }

  if (normalizedCmd === 'git log') {
    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `📜 注文履歴を表示。次: ${nextStep}`
          : '📜 注文履歴を表示',
      })
    } else {
      setMessage('📜 注文履歴を表示')
      setInputCommand('')
    }
    setIsPaused(false)
    setIsCompactLog(false)
    setShowLog(true)
    return
  }

  if (normalizedCmd === 'git lof --oneline' || normalizedCmd === 'git log --oneline') {
    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `👋 おかえりでーす！レシート簡易表示。次: ${nextStep}`
          : '👋 おかえりでーす！レシート簡易表示',
      })
    } else {
      setMessage('🧾 レシート簡易表示')
      setInputCommand('')
    }
    setIsPaused(false)
    setIsCompactLog(true)
    setShowLog(true)
    return
  }

  if (normalizedCmd === 'git status') {
    if (!activeRamen) {
      setMessage('📊 お腹すいた～')
      setStatusWindow({
        title: '伝票 / git status',
        phaseMessage: '厨房の状態: まだ調理中の注文がありません。',
        details: ['注文待機中'],
      })
      setTimeout(() => setStatusWindow(null), 2300)
    } else {
      const requiredItems = activeRamen.steps
        .filter(step => step.type === 'add' && step.itemName)
        .map(step => step.itemName as string)
      const uniqueItems = Array.from(new Set([...requiredItems, ...activeRamen.stagedItems]))

      const phaseMessage = (() => {
        if (activeRamen.stagedItems.length === 0) {
          return '厨房の状態: まだ具材が選ばれていません！ git add で具材を乗せてください。'
        }

        if (!activeRamen.isCommitted) {
          return '厨房の状態: 具材は乗っています！ あとは git commit -m で注文を確定させてください。'
        }

        if (!activeRamen.isPushed) {
          return '厨房の状態: 調理完了！ 爆速で git push してお客さんに届けてください！'
        }

        return '厨房の状態: 配達中です。無事に届くか見守りましょう。'
      })()

      const itemDetails = uniqueItems.length > 0
        ? uniqueItems.map(item => `具材：[${item}] (${activeRamen.stagedItems.includes(item) ? '投入済み' : '未投入'})`)
        : ['具材：[なし] (未投入)']

      const details = [
        `対象ラーメン: #${activeRamen.id} / Lane${activeRamen.currentLane} -> Lane${activeRamen.targetLane}`,
        `isCommitted: ${activeRamen.isCommitted ? 'true' : 'false'}`,
        `isPushed: ${activeRamen.isPushed ? 'true' : 'false'}`,
        ...itemDetails,
      ]

      setStatusWindow({
        title: '伝票 / git status',
        phaseMessage,
        details,
      })
      setTimeout(() => setStatusWindow(null), 2600)

      setMessage(`📊 状態確認: ${phaseMessage}`)
      if (isCurrentStepMatch(activeRamen, normalizedCmd)) {
        const nextStep = getNextStepCommand(activeRamen)
        completeCurrentStep(activeRamen, {
          message: nextStep
            ? `📊 状態確認完了。次: ${nextStep}`
            : '📊 状態確認完了',
        })
        return
      }
    }
    setInputCommand('')
    return
  }

  // 入力されたコマンドが 'git push origin 〇〇' の形かチェックする
  const pushMatch = cmd.match(/^git push origin (.+)$/i)
  if (pushMatch) {
    if (!activeRamen) {
      // recordMiss(activeRamen)
      setMessage('❌ 配達できるラーメンがありません')
      setInputCommand('')
      return
    }

    // 入力されたブランチ名
    const targetBranch = pushMatch[1].trim() 
    // 今いるブランチ名
    const currentBranchName = existingBranches[activeRamen.currentLane - 1] || 'main'

    // ブランチ名が違う場合のエラーメッセージを
    if (normalizeCommand(targetBranch) !== normalizeCommand(currentBranchName)) {
      setMessage(`❌ 今いるのは ${currentBranchName} です。${targetBranch} に push するには、先に ${targetBranch} ブランチに移動してください！`)
      setInputCommand('')
      return
    }

    // すでにブランチの一致チェックを通過しているので、「他レーンからmainに無理やり流した」という判定は false で確定！
    const pushedToMainFromOtherLane = false
    // ----------------------

    const isCurrentPushStep = currentStep?.type === 'push' && isCurrentStepMatch(activeRamen, normalizedCmd)

    if (isCurrentPushStep) {
      completeCurrentStep(activeRamen, {
        scoreDelta: 0,
        message: '🚀 push 完了！お客さんのところへ急げーー！！',
        update: () => ({ speed: pushSpeed, isPushed: true, pushedToMainFromOtherLane }),
      })
      return
    }

    setRamens(prev => prev.map(r => {
      if (r.id !== activeRamen.id) return r
      return {
        ...r,
        speed: pushSpeed,
        isPushed: true,
        pushedToMainFromOtherLane, // ← ここに false が渡るようになります
      }
    }))

    if (!activeRamen.isCommitted) {
      recordMiss(activeRamen)
      setMessage('💢 トッピングはどうした💢 空のまま push してしまった！')
    } else {
      setMessage('🚀 push を実行！ものすごい勢いで流れていく！')
    }

    setInputCommand('')
    return
  }



  if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
    const nextStep = getNextStepCommand(activeRamen)
    completeCurrentStep(activeRamen, {
      message: nextStep
        ? `✅ 「${cmd}」完了！次: ${nextStep}`
        : `✅ 正解！「${cmd}」を実行しました！`,
    })
    return
  }

  const matchingCmd = availableCommands.find(c => normalizeCommand(c.command) === normalizedCmd)

  if (currentStep) {
    recordMiss(activeRamen)
    setMessage(`❌ 今は「${currentStep.displayCommand}」の番です`)
  } else if (matchingCmd) {
    recordMiss(activeRamen)
    setMessage('❌ そのコマンドは今じゃない！現在のラーメンのコマンドを入力してください')
  } else {
    recordMiss(activeRamen)
    setMessage(`❓ 不明なコマンド: ${cmd}`)
  }

  setInputCommand('')
}
