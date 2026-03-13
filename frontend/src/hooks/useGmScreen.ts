import { useState, useEffect, useRef } from 'react'
import { fetchCommandsByCourse } from '../api/cmdFetch_1'
import type { Command, Ramen, CommandHistory, OrderLog } from '../interface'
import { resolveRuntimeCommandLogic } from '../game/commandLogic'

const GAME_TIME_LIMIT = 60
const RAMEN_SPEED = 0.12
const PUSH_SPEED = 5.0
const SPAWN_CHECK_INTERVAL = 500
const MAX_RAMENS = 1
const MAX_LANES = 3
const MIN_SPAWN_DELAY = 500
const MIN_POSITION_GAP = 4
const AVAILABLE_ITEMS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン']
type FormOnSubmit = NonNullable<React.ComponentProps<'form'>['onSubmit']>

function normalizeCommand(input: string): string {
  return input
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function useGmScreen() {
  const [inputCommand, setInputCommand] = useState('')
  const [ramens, setRamens] = useState<Ramen[]>([])
  const [score, setScore] = useState(0)
  const [course, setCourse] = useState(1)
  const [message, setMessage] = useState('git help でヒントを表示')
  const [showHelp, setShowHelp] = useState(false)
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([])
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([])
  const [showLog, setShowLog] = useState(false)
  const [isCompactLog, setIsCompactLog] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(GAME_TIME_LIMIT)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [availableCommands, setAvailableCommands] = useState<Command[]>([])
  const [nextRamenId, setNextRamenId] = useState(1)
  const [laneCount, setLaneCount] = useState(1)

  useEffect(() => { laneCountRef.current = laneCount }, [laneCount])
  useEffect(() => { nextRamenIdRef.current = nextRamenId }, [nextRamenId])

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpawnTimeRef = useRef<number>(0)
  const laneCountRef = useRef<number>(1)
  const nextRamenIdRef = useRef<number>(1)

  const getLaneRamens = (lane: number) => {
    return ramens.filter(r => r.currentLane === lane && !r.isCompleted)
  }

  const getActiveRamen = () => {
    const activeRamens = ramens.filter(r => !r.isCompleted)
    if (activeRamens.length === 0) return null
    return activeRamens.reduce((prev, curr) =>
      prev.position > curr.position ? prev : curr
    )
  }

  const appendOrderLog = (ramen: Ramen) => {
    setOrderLogs(prev => [...prev, {
      ramenId: ramen.id,
      lane: ramen.targetLane,
      orderCommand: ramen.displayCommand,
      gameNote: ramen.command.game_note,
      result: 'pending',
      summary: `注文受付: ${ramen.displayCommand}`,
      timestamp: new Date(),
    }])
  }

  const finalizeOrderLog = (ramenId: number, result: 'delivered' | 'failed', summary: string) => {
    setOrderLogs(prev => {
      let updated = false
      return prev.map((log) => {
        if (!updated && log.ramenId === ramenId && log.result === 'pending') {
          updated = true
          return { ...log, result, summary, timestamp: new Date() }
        }
        return log
      })
    })
  }

  const resumeGame = () => {
    setShowLog(false)
    setIsPaused(false)
    setMessage('▶ ゲーム再開！')
  }

  const spawnRamen = (commands: Command[]) => {
    if (commands.length === 0) return

    const now = Date.now()
    const timeSinceLastSpawn = now - lastSpawnTimeRef.current

    if (lastSpawnTimeRef.current !== 0 && timeSinceLastSpawn < MIN_SPAWN_DELAY) {
      return
    }

    let shouldSpawn = false
    let spawnedRamen: Ramen | null = null

    setRamens(prev => {
      const activeRamens = prev.filter(r => !r.isCompleted)
      if (activeRamens.length >= MAX_RAMENS) {
        return prev
      }

      if (activeRamens.length > 0) {
        const minPosition = Math.min(...activeRamens.map(r => r.position))
        if (minPosition < MIN_POSITION_GAP) {
          return prev
        }
      }

      shouldSpawn = true

      const randomCommand = commands[Math.floor(Math.random() * commands.length)]
      const runtimeLogic = resolveRuntimeCommandLogic(randomCommand)
      const startLane = Math.floor(Math.random() * laneCountRef.current) + 1
      const targetLane = Math.floor(Math.random() * laneCountRef.current) + 1

      const newRamen: Ramen = {
        id: nextRamenIdRef.current,
        command: randomCommand,
        displayCommand: runtimeLogic.displayCommand,
        expectedInputs: runtimeLogic.expectedInputs,
        logicLabel: runtimeLogic.logicLabel,
        logicDescription: runtimeLogic.logicDescription,
        logicExample: runtimeLogic.logicExample,
        currentLane: startLane,
        targetLane: targetLane,
        position: 0,
        isCompleted: false,
        stagedItems: [],
        isCommitted: false,
        commandsExecuted: 0,
        pushThreshold: Math.floor(Math.random() * 2) + 2, // 2 or 3
        isPushReady: false,
        speed: RAMEN_SPEED,
        hasRequiredCommandExecuted: false,
      }

      spawnedRamen = newRamen

      setMessage(`🍜 新しいラーメン #${nextRamenId}！Lane ${startLane} → Lane ${targetLane} へ`)
      return [...prev, newRamen]
    })

    if (shouldSpawn) {
      lastSpawnTimeRef.current = now
      nextRamenIdRef.current = nextRamenIdRef.current + 1
      setNextRamenId(nextRamenIdRef.current)
      if (spawnedRamen) appendOrderLog(spawnedRamen)
    }
  }

  const startGame = async () => {
    setIsLoading(true)
    setTimeRemaining(GAME_TIME_LIMIT)
    setIsGameOver(false)
    setRamens([])
    setNextRamenId(1)
    setLaneCount(1)
    setShowLog(false)
    setIsCompactLog(false)
    setIsPaused(false)
    setOrderLogs([])
    lastSpawnTimeRef.current = 0
    laneCountRef.current = 1
    nextRamenIdRef.current = 1

    try {
      const commands = await fetchCommandsByCourse(course, 20)

      if (!commands || commands.length === 0) {
        setMessage('❌ コマンドが取得できませんでした')
        return
      }

      setAvailableCommands(commands)
      setMessage(`🎮 コース ${course} スタート！git clone URL で注文、git add で具材追加！`)
      setTimeout(() => spawnRamen(commands), 500)
    } catch (error) {
      console.error('Failed to load commands:', error)
      setMessage('❌ サーバーに接続できません')
    } finally {
      setIsLoading(false)
    }
  }

  const gameOver = () => {
    setIsGameOver(true)
    if (timerRef.current) clearInterval(timerRef.current)
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)

    setMessage(`⏰ タイムアップ！最終スコア: ${score}点`)

    setTimeout(() => {
      const retry = window.confirm(`スコア: ${score}点\nもう一度プレイしますか？`)
      if (retry) {
        setScore(0)
        setCommandHistory([])
        startGame()
      }
    }, 1000)
  }

  useEffect(() => {
    startGame()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    }
  }, [course])

  useEffect(() => {
    if (isLoading || isGameOver || isPaused) return

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          gameOver()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLoading, isGameOver, isPaused])

  useEffect(() => {
    if (isLoading || isGameOver || isPaused) return

    moveIntervalRef.current = setInterval(() => {
      setRamens(prev => {
        return prev.map(ramen => {
          if (ramen.isCompleted) return ramen

          const newPosition = Math.min(100, ramen.position + ramen.speed)

          if (newPosition >= 100) {
            if (!ramen.hasRequiredCommandExecuted) {
              setScore(s => Math.max(0, s - 50))
              setMessage('❌ 失敗！命令未達成のまま配達してしまいました (-50点)')
              finalizeOrderLog(ramen.id, 'failed', '命令未達成で配達失敗')
            } else if (ramen.currentLane === ramen.targetLane) {
              setScore(s => s + 100 * course)
              setMessage(`✅ 正解！Lane ${ramen.targetLane} のお客さんに届きました！ +${100 * course}点`)
              finalizeOrderLog(ramen.id, 'delivered', `配達成功: Lane ${ramen.targetLane}`)
            } else {
              setScore(s => Math.max(0, s - 50))
              setMessage(`❌ 間違い！Lane ${ramen.targetLane} に届けるべきでした (-50点)`)
              finalizeOrderLog(ramen.id, 'failed', `配達先ミス: Lane ${ramen.targetLane}`)
            }
            setTimeout(() => {
              setRamens(p => p.filter(r => r.id !== ramen.id))
              setTimeout(() => {
                if (availableCommands.length > 0) {
                  spawnRamen(availableCommands)
                }
              }, 500)
            }, 1000)
            return { ...ramen, position: 100, isCompleted: true }
          }

          return { ...ramen, position: newPosition }
        })
      })
    }, 50)

    return () => {
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)
    }
  }, [isLoading, isGameOver, isPaused, course, availableCommands])

  useEffect(() => {
    if (isLoading || isGameOver || isPaused || availableCommands.length === 0) return

    spawnIntervalRef.current = setInterval(() => {
      spawnRamen(availableCommands)
    }, SPAWN_CHECK_INTERVAL)

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    }
  }, [isLoading, isGameOver, isPaused, availableCommands])

  const handleSubmit: FormOnSubmit = (e) => {
    e.preventDefault()

    if (!inputCommand.trim() || isGameOver) return

    const cmd = inputCommand.trim()
    const normalizedCmd = normalizeCommand(cmd)
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

      if (activeRamen.command.command.toLowerCase() === 'git add <file>') {
        const expectedItem = activeRamen.displayCommand.replace(/^git add\s+/i, '').trim()
        if (item.toLowerCase() !== expectedItem.toLowerCase()) {
          setMessage(`❌ 今回の指定具材は「${expectedItem}」です`)
          setInputCommand('')
          return
        }
      }

      const willBePushReady = !activeRamen.isPushReady && (activeRamen.commandsExecuted + 1) >= activeRamen.pushThreshold

      if (item === '.') {
        const isRequiredAddAll = activeRamen.command.id === 5 || activeRamen.expectedInputs.some(input => normalizeCommand(input) === 'git add .')
        setRamens(prev => prev.map(r => {
          if (r.id !== activeRamen.id) return r
          const newCount = r.commandsExecuted + 1
          return {
            ...r,
            stagedItems: [...AVAILABLE_ITEMS],
            commandsExecuted: newCount,
            isPushReady: newCount >= r.pushThreshold,
            hasRequiredCommandExecuted: r.hasRequiredCommandExecuted || isRequiredAddAll,
          }
        }))
        setMessage(willBePushReady
          ? '🚀 全マシ全のせ完了！準備完了！git push origin main でお客さんに届けよう！'
          : '✅ 全マシ全のせ！')
      } else if (AVAILABLE_ITEMS.includes(item)) {
        if (activeRamen.stagedItems.includes(item)) {
          setMessage(`⚠️ ${item}は既に追加されています`)
          setInputCommand('')
          return
        }
        const isThisRequiredTopping = activeRamen.expectedInputs.some(input => normalizeCommand(input) === normalizedCmd)
        setRamens(prev => prev.map(r => {
          if (r.id !== activeRamen.id) return r
          const newCount = r.commandsExecuted + 1
          return { ...r, stagedItems: [...r.stagedItems, item], commandsExecuted: newCount, isPushReady: newCount >= r.pushThreshold, hasRequiredCommandExecuted: r.hasRequiredCommandExecuted || isThisRequiredTopping }
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
      const targetLane = parseInt(switchMatch[2])

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
      const nextLane = laneCount < MAX_LANES ? laneCount + 1 : laneCount

      if (laneCount < MAX_LANES) {
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

      if (laneCount < MAX_LANES) {
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
      setShowHelp(!showHelp)
      setMessage(showHelp ? 'ヒントを非表示' : '💡 ヒントを表示')
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
            speed: PUSH_SPEED,
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

  const handleLevelChange = (newCourse: number) => {
    if (isLoading) return
    setCourse(newCourse)
    setScore(0)
    setCommandHistory([])
  }

  const activeRamen = getActiveRamen()

  return {
    inputCommand,
    setInputCommand,
    ramens,
    score,
    course,
    message,
    showHelp,
    commandHistory,
    showLog,
    timeRemaining,
    isGameOver,
    isLoading,
    handleSubmit,
    handleLevelChange,
    getLaneRamens,
    activeRamen,
    availableItems: AVAILABLE_ITEMS,
    laneCount,
    orderLogs,
    isCompactLog,
    isPaused,
    resumeGame,
  }
}
