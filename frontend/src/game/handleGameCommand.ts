import type { Dispatch, SetStateAction } from 'react'
import type { Command, CommandHistory, Ramen } from '../interface'

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

  if (cmd.match(/^git clone .+$/i)) {
    setMessage('📝 注文を開始します！ラーメンが流れてくるのを待ってください')
    setInputCommand('')
    return
  }

  const addMatch = cmd.match(/^git add (.+)$/i)
  if (addMatch) {
    const activeRamen = getActiveRamen()
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    const item = addMatch[1].trim()

    const isAddOrder = activeRamen.command.command.toLowerCase().startsWith('git add')

    const willBePushReady = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold

    if (item === '.') {
      const isRequiredAddAll =
        activeRamen.command.id === 5 ||
        activeRamen.expectedInputs.some(input => normalizeCommand(input) === 'git add .') ||
        isAddOrder
      setRamens(prev => prev.map(r => {
        if (r.id !== activeRamen.id) return r
        const newCount = r.commandsExecuted + 1
        return {
          ...r,
          stagedItems: [...availableItems],
          commandsExecuted: newCount,
          isPushReady: newCount >= r.pushThreshold,
          hasRequiredCommandExecuted: r.hasRequiredCommandExecuted || isRequiredAddAll,
        }
      }))
      setMessage(willBePushReady
        ? '🚀 全マシ全のせ完了！準備完了！git push origin main でお客さんに届けよう！'
        : '✅ 全マシ全のせ！')
    } else if (availableItems.includes(item)) {
      if (activeRamen.stagedItems.includes(item)) {
        setMessage(`⚠️ ${item}は既に追加されています`)
        setInputCommand('')
        return
      }
      const isThisRequiredTopping = activeRamen.expectedInputs.some(input => normalizeCommand(input) === normalizedCmd)
      const marksAddStepDone = isAddOrder || isThisRequiredTopping
      setRamens(prev => prev.map(r => {
        if (r.id !== activeRamen.id) return r
        const newCount = r.commandsExecuted + 1
        return {
          ...r,
          stagedItems: [...r.stagedItems, item],
          commandsExecuted: newCount,
          isPushReady: newCount >= r.pushThreshold,
          hasRequiredCommandExecuted: r.hasRequiredCommandExecuted || marksAddStepDone,
        }
      }))
      setMessage(willBePushReady
        ? `🚀 ${item}を追加！準備完了！git push origin main でお客さんに届けよう！`
        : `✅ ${item}を追加しました`)
    } else {
      setMessage(`❌ ${item}という具材はありません`)
    }
    setInputCommand('')
    return
  }

  const commitMatch = cmd.match(/^git commit -m "(.+)"$/i)
  if (commitMatch) {
    const activeRamen = getActiveRamen()
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    const willBePushReadyCommit = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
    const isRequiredCommitCall = activeRamen.command.id === 6 || activeRamen.expectedInputs.some(input => normalizeCommand(input) === normalizedCmd)
    setRamens(prev => prev.map(r => {
      if (r.id !== activeRamen.id) return r
      const newCount = r.commandsExecuted + 1
      return {
        ...r,
        isCommitted: true,
        commandsExecuted: newCount,
        isPushReady: newCount >= r.pushThreshold,
        hasRequiredCommandExecuted: r.hasRequiredCommandExecuted || isRequiredCommitCall,
      }
    }))
    const callText = commitMatch[1]
    setMessage(willBePushReadyCommit
      ? `🚀 ${callText} 準備完了！git push origin main でお客さんに届けよう！`
      : `🍜 ${callText}`)
    setInputCommand('')
    return
  }

  const switchMatch = cmd.match(/^git (switch|checkout) lane([1-3])$/i)
  if (switchMatch) {
    const targetLane = parseInt(switchMatch[2], 10)

    const activeRamen = getActiveRamen()
    if (activeRamen) {
      if (targetLane > laneCount) {
        setMessage(`❌ Lane ${targetLane} は未開設です。git branch <lane名> でレーンを追加してください`)
        setInputCommand('')
        return
      }

      const willBePushReadySwitch = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
      setRamens(prev => prev.map(r => {
        if (r.id !== activeRamen.id) return r
        const newCount = r.commandsExecuted + 1
        return { ...r, currentLane: targetLane, commandsExecuted: newCount, isPushReady: newCount >= r.pushThreshold }
      }))
      setMessage(willBePushReadySwitch
        ? `🚀 Lane ${targetLane} に移動！準備完了！git push origin main でお客さんに届けよう！`
        : `🔀 ラーメン #${activeRamen.id} を Lane ${targetLane} に移動`)
    } else {
      setMessage('❌ 移動できるラーメンがありません')
    }
    setInputCommand('')
    return
  }

  if (normalizedCmd === 'git branch') {
    const activeRamen = getActiveRamen()
    const laneList = Array.from({ length: laneCount }, (_, i) => `lane${i + 1}`).join(', ')
    if (activeRamen && activeRamen.command.id === 11) {
      const willBePushReady = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
      setRamens(prev => prev.map(r => {
        if (r.id !== activeRamen.id) return r
        const newCount = r.commandsExecuted + 1
        return {
          ...r,
          commandsExecuted: newCount,
          isPushReady: newCount >= r.pushThreshold,
          hasRequiredCommandExecuted: true,
        }
      }))
      setMessage(willBePushReady
        ? `🚀 現在のレーン: ${laneList}。準備完了！git push origin main で届けよう！`
        : `🌿 現在のレーン: ${laneList}`)
    } else {
      setMessage(`🌿 現在のレーン: ${laneList}`)
    }
    setInputCommand('')
    return
  }

  const checkoutBranchMatch = cmd.match(/^git checkout -b (.+)$/i)
  if (checkoutBranchMatch) {
    const activeRamen = getActiveRamen()
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    const laneName = checkoutBranchMatch[1].trim()
    const isRequiredCheckout = activeRamen.command.id === 114 || activeRamen.expectedInputs.some(input => normalizeCommand(input) === normalizedCmd)
    const willBePushReady = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
    const nextLane = laneCount < maxLanes ? laneCount + 1 : laneCount

    if (laneCount < maxLanes) {
      setLaneCount(nextLane)
    }

    setRamens(prev => prev.map(r => {
      if (r.id !== activeRamen.id) return r
      const newCount = r.commandsExecuted + 1
      return {
        ...r,
        currentLane: nextLane,
        commandsExecuted: newCount,
        isPushReady: newCount >= r.pushThreshold,
        hasRequiredCommandExecuted: r.hasRequiredCommandExecuted || isRequiredCheckout,
      }
    }))

    setMessage(willBePushReady
      ? `🚀 ${laneName} を作成して Lane ${nextLane} へ切替！準備完了！`
      : `🆕 ${laneName} を作成して Lane ${nextLane} へ切替！`)
    setInputCommand('')
    return
  }

  const branchMatch = cmd.match(/^git branch (.+)$/i)
  if (branchMatch) {
    const activeRamen = getActiveRamen()
    if (!activeRamen) {
      setMessage('❌ 操作できるラーメンがありません')
      setInputCommand('')
      return
    }

    const isBranchOrder = activeRamen.command.id === 12 || /^git branch\s+/i.test(activeRamen.displayCommand)
    if (!isBranchOrder) {
      setMessage('❌ 今は branch の注文ではありません')
      setInputCommand('')
      return
    }

    const laneName = branchMatch[1].trim()
    const willBePushReadyBranch = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold

    setRamens(prev => prev.map(r => {
      if (r.id !== activeRamen.id) return r
      const newCount = r.commandsExecuted + 1
      return {
        ...r,
        commandsExecuted: newCount,
        isPushReady: newCount >= r.pushThreshold,
        hasRequiredCommandExecuted: true,
      }
    }))

    if (laneCount < maxLanes) {
      const nextLane = laneCount + 1
      setLaneCount(nextLane)
      setMessage(willBePushReadyBranch
        ? `🚀 Lane ${nextLane}（${laneName}）を開設！準備完了！git push origin main で届けよう！`
        : `🆕 Lane ${nextLane}（${laneName}）を開設！お客さんが増えました！`)
    } else {
      setMessage(willBePushReadyBranch
        ? '🚀 既に最大レーンです（3）。準備完了！git push origin main で届けよう！'
        : 'ℹ️ 既に最大レーン数（3）です')
    }

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
    const activeRamen = getActiveRamen()
    if (activeRamen && activeRamen.command.id === 9) {
      const willBePushReady = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
      setRamens(prev => prev.map(r => {
        if (r.id !== activeRamen.id) return r
        const newCount = r.commandsExecuted + 1
        return {
          ...r,
          commandsExecuted: newCount,
          isPushReady: newCount >= r.pushThreshold,
          hasRequiredCommandExecuted: true,
        }
      }))
      setMessage(willBePushReady
        ? '📜 注文履歴を表示（一時停止中）。準備完了！'
        : '📜 注文履歴を表示（一時停止中）')
    } else {
      setMessage('📜 注文履歴を表示（一時停止中）')
    }
    setIsCompactLog(false)
    setShowLog(true)
    setInputCommand('')
    return
  }

  if (normalizedCmd === 'git lof --oneline' || normalizedCmd === 'git log --oneline') {
    const activeRamen = getActiveRamen()
    if (activeRamen && activeRamen.command.id === 10) {
      const willBePushReady = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
      setRamens(prev => prev.map(r => {
        if (r.id !== activeRamen.id) return r
        const newCount = r.commandsExecuted + 1
        return {
          ...r,
          commandsExecuted: newCount,
          isPushReady: newCount >= r.pushThreshold,
          hasRequiredCommandExecuted: true,
        }
      }))
      setMessage(willBePushReady
        ? '👋 おかえりでーす！レシート簡易表示（一時停止）準備完了！'
        : '👋 おかえりでーす！レシート簡易表示（一時停止）')
    } else {
      setMessage('🧾 レシート簡易表示（一時停止）')
    }
    setIsCompactLog(true)
    setShowLog(true)
    setInputCommand('')
    return
  }

  if (normalizedCmd === 'git status') {
    const activeRamen = getActiveRamen()
    if (!activeRamen) {
      setMessage('📊 お腹すいた～')
    } else {
      const statusPrefix = activeRamen.command.id === 3 ? '🆘 お客さんの注文を忘れた！確認しよう！' : '📊 状態確認:'
      setMessage(`${statusPrefix} ⭐#${activeRamen.id}: 「${activeRamen.displayCommand}」 Lane${activeRamen.currentLane}→${activeRamen.targetLane} ${Math.floor(activeRamen.position)}% | 具材: ${activeRamen.stagedItems.join(', ') || 'なし'}`)
      if (activeRamen.command.id === 3) {
        const willBePushReady = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
        setRamens(prev => prev.map(r => {
          if (r.id !== activeRamen.id) return r
          const newCount = r.commandsExecuted + 1
          return {
            ...r,
            commandsExecuted: newCount,
            isPushReady: newCount >= r.pushThreshold,
            hasRequiredCommandExecuted: true,
          }
        }))
        if (willBePushReady) {
          setMessage(`🆘 お客さんの注文を忘れた！確認しよう！ ⭐#${activeRamen.id}: 「${activeRamen.displayCommand}」 Lane${activeRamen.currentLane}→${activeRamen.targetLane} ${Math.floor(activeRamen.position)}% | 具材: ${activeRamen.stagedItems.join(', ') || 'なし'} | 🚀 準備完了！`)
        }
      }
    }
    setInputCommand('')
    return
  }

  if (normalizedCmd === 'git push origin main') {
    const activeRamen = getActiveRamen()
    if (!activeRamen) {
      setMessage('❌ 配達できるラーメンがありません')
      setInputCommand('')
      return
    }

    const completesRequiredCommand = activeRamen.expectedInputs.some(input => normalizeCommand(input) === normalizedCmd)

    setRamens(prev => prev.map(r =>
      r.id === activeRamen.id
        ? {
          ...r,
          speed: pushSpeed,
          isPushReady: true,
          hasRequiredCommandExecuted: r.hasRequiredCommandExecuted || completesRequiredCommand,
        }
        : r
    ))
    setMessage(completesRequiredCommand || activeRamen.hasRequiredCommandExecuted
      ? '🚀 プッシュ！お客さんのところへ急げーー！！'
      : '🚀 強制プッシュ！ただし命令未達成なので失敗判定になります')
    setInputCommand('')
    return
  }

  const activeRamen = getActiveRamen()
  if (activeRamen && activeRamen.expectedInputs.some(input => normalizeCommand(input) === normalizedCmd)) {
    setScore(s => s + 50 * course)
    const willBePushReadyCmd = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold
    setRamens(prev => prev.map(r => {
      if (r.id !== activeRamen.id) return r
      const newCount = r.commandsExecuted + 1
      return {
        ...r,
        commandsExecuted: newCount,
        isPushReady: newCount >= r.pushThreshold,
        hasRequiredCommandExecuted: true,
      }
    }))
    setMessage(willBePushReadyCmd
      ? `🚀 「${cmd}」正解！準備完了！git push origin main でお客さんに届けよう！`
      : `✅ 正解！「${cmd}」を実行しました！`)
    setInputCommand('')
    return
  }

  const matchingCmd = availableCommands.find(c => normalizeCommand(c.command) === normalizedCmd)

  if (matchingCmd) {
    setMessage('❌ そのコマンドは今じゃない！現在のラーメンのコマンドを入力してください')
  } else {
    setMessage(`❓ 不明なコマンド: ${cmd}`)
  }

  setInputCommand('')
}
