import type { Dispatch, SetStateAction } from 'react'
import type { Command, CommandHistory, Ramen } from '../types/interface'
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
  laneCount: number
  showHelp: boolean
  availableCommands: Command[]
  availableItems: string[]
  maxLanes: number
  pushSpeed: number
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
  setIsPaused: (value: boolean) => void
}

export function executeGameCommand(params: ExecuteGameCommandParams): void {
  const {
    cmd,
    normalizedCmd,
    isGameOver,
    course,
    laneCount,
    showHelp,
    availableCommands,
    availableItems,
    maxLanes,
    pushSpeed,
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
    setIsPaused,
  } = params

  if (!cmd.trim() || isGameOver) return

  setCommandHistory(prev => [...prev, { command: cmd, timestamp: new Date() }])

  const activeRamen = getActiveRamen()
  const currentStep = activeRamen ? getCurrentCommandStep(activeRamen) : null

  const isCurrentStepMatch = (ramen: Ramen | null, input: string): boolean => {
    const step = ramen ? getCurrentCommandStep(ramen) : null
    return step?.expectedInputs.some(expected => normalizeCommand(expected) === input) ?? false
  }

  const getNextStepCommand = (ramen: Ramen): string | null => {
    return ramen.steps[ramen.currentStepIndex + 1]?.displayCommand ?? null
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

  const rejectOutOfOrder = (stepType: 'add' | 'commit' | 'push') => {
    if (!currentStep) return false
    if (currentStep.type === stepType) return false

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
    setMessage('📝 注文を開始します！ラーメンが流れてくるのを待ってください')
    setInputCommand('')
    return
  }

  const addMatch = cmd.match(/^git add (.+)$/i)
  if (addMatch) {
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    if (rejectOutOfOrder('add')) return

    const item = addMatch[1].trim()
    const nextStep = getNextStepCommand(activeRamen)

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
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
      setMessage(`❌ ${item}という具材はありません`)
      setInputCommand('')
    }
    return
  }

  const commitMatch = cmd.match(/^git commit -m "(.+)"$/i)
  if (commitMatch) {
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    if (rejectOutOfOrder('commit')) return

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
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

  const switchMatch = cmd.match(/^git (switch|checkout) lane([1-3])$/i)
  if (switchMatch) {
    const targetLane = parseInt(switchMatch[2], 10)

    if (activeRamen) {
      if (targetLane > laneCount) {
        setMessage(`❌ Lane ${targetLane} は未開設です。git branch <lane名> でレーンを追加してください`)
        setInputCommand('')
        return
      }

      if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
        setMessage(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
        setInputCommand('')
        return
      }

      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `🔀 ラーメン #${activeRamen.id} を Lane ${targetLane} に移動。次: ${nextStep}`
          : `🔀 ラーメン #${activeRamen.id} を Lane ${targetLane} に移動`,
        update: () => ({ currentLane: targetLane }),
      })
    } else {
      setMessage('❌ 移動できるラーメンがありません')
      setInputCommand('')
    }
    return
  }

  if (normalizedCmd === 'git branch') {
    const laneList = Array.from({ length: laneCount }, (_, i) => `lane${i + 1}`).join(', ')
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

  const checkoutBranchMatch = cmd.match(/^git checkout -b (.+)$/i)
  if (checkoutBranchMatch) {
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      setMessage(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
      setInputCommand('')
      return
    }

    const laneName = checkoutBranchMatch[1].trim()
    const nextLane = laneCount < maxLanes ? laneCount + 1 : laneCount

    if (laneCount < maxLanes) {
      setLaneCount(nextLane)
    }

    const nextStep = getNextStepCommand(activeRamen)
    completeCurrentStep(activeRamen, {
      message: nextStep
        ? `🆕 ${laneName} を作成して Lane ${nextLane} へ切替！ 次: ${nextStep}`
        : `🆕 ${laneName} を作成して Lane ${nextLane} へ切替！`,
      update: () => ({ currentLane: nextLane }),
    })
    return
  }

  const branchMatch = cmd.match(/^git branch (.+)$/i)
  if (branchMatch) {
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      setMessage(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
      setInputCommand('')
      return
    }

    const laneName = branchMatch[1].trim()
    const nextStep = getNextStepCommand(activeRamen)

    if (laneCount < maxLanes) {
      const nextLane = laneCount + 1
      setLaneCount(nextLane)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `🆕 Lane ${nextLane}（${laneName}）を開設！ 次: ${nextStep}`
          : `🆕 Lane ${nextLane}（${laneName}）を開設！お客さんが増えました！`,
      })
    } else {
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `ℹ️ 既に最大レーン数（3）です。次: ${nextStep}`
          : 'ℹ️ 既に最大レーン数（3）です',
      })
    }
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
          ? `📜 注文履歴を表示（一時停止中）。次: ${nextStep}`
          : '📜 注文履歴を表示（一時停止中）',
      })
    } else {
      setMessage('📜 注文履歴を表示（一時停止中）')
      setInputCommand('')
    }
    setIsCompactLog(false)
    setShowLog(true)
    return
  }

  if (normalizedCmd === 'git lof --oneline' || normalizedCmd === 'git log --oneline') {
    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      const nextStep = getNextStepCommand(activeRamen)
      completeCurrentStep(activeRamen, {
        message: nextStep
          ? `👋 おかえりでーす！レシート簡易表示（一時停止）。次: ${nextStep}`
          : '👋 おかえりでーす！レシート簡易表示（一時停止）',
      })
    } else {
      setMessage('🧾 レシート簡易表示（一時停止）')
      setInputCommand('')
    }
    setIsCompactLog(true)
    setShowLog(true)
    return
  }

  if (normalizedCmd === 'git status') {
    if (!activeRamen) {
      setMessage('📊 お腹すいた～')
    } else {
      const statusPrefix = isCurrentStepMatch(activeRamen, normalizedCmd) ? '📊 状態確認（ステップ確認）:' : '📊 状態確認:'
      setMessage(`${statusPrefix} ⭐#${activeRamen.id}: 「${activeRamen.displayCommand}」 Lane${activeRamen.currentLane}→${activeRamen.targetLane} ${Math.floor(activeRamen.position)}% | 具材: ${activeRamen.stagedItems.join(', ') || 'なし'}`)
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

  if (normalizedCmd === 'git push origin main') {
    if (!activeRamen) {
      setMessage('❌ 配達できるラーメンがありません')
      setInputCommand('')
      return
    }

    if (rejectOutOfOrder('push')) return

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      setMessage(`❌ 今必要な push は「${currentStep?.displayCommand ?? ''}」です`)
      setInputCommand('')
      return
    }

    completeCurrentStep(activeRamen, {
      scoreDelta: 0,
      message: '🚀 push 完了！お客さんのところへ急げーー！！',
      update: () => ({ speed: pushSpeed }),
    })
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
    setMessage(`❌ 今は「${currentStep.displayCommand}」の番です`)
  } else if (matchingCmd) {
    setMessage('❌ そのコマンドは今じゃない！現在のラーメンのコマンドを入力してください')
  } else {
    setMessage(`❓ 不明なコマンド: ${cmd}`)
  }

  setInputCommand('')
}
