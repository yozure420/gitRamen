import { useState, useEffect, useRef } from 'react'
import { fetchCommandCatalogByCourse, fetchCommandsByCourse } from '../api/cmdFetch_1'
import type { Command, Ramen, CommandHistory, OrderLog, CustomerAlert, StatusWindowData } from '../types/interface'
import { createLaneAwarePullOrderPayload } from '../game/commandLogic'
import { executeGameCommand, normalizeCommand } from '../game/handleGameCommand'
import { createRamenEntry, selectActiveRamen, selectLaneRamens } from '../game/gameEngine'
import { useGameTimer, useRamenMovement } from './useGameEffects'
import type { SoundSettings } from '../types/interface'

const GAME_TIME_LIMIT = 60
const RAMEN_SPEED = 0.12
const PUSH_SPEED = 5.0
const MAX_LANES = 3
const AVAILABLE_ITEMS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン', 'ナルト']
type FormOnSubmit = NonNullable<React.ComponentProps<'form'>['onSubmit']>

type UseGmScreenParams = {
  soundSettings: SoundSettings
  initialCourse: number
}

export function useGmScreen({ soundSettings, initialCourse }: UseGmScreenParams) {
  const [inputCommand, setInputCommand] = useState('')
  const [ramens, setRamens] = useState<Ramen[]>([])
  const [score, setScore] = useState(0)
  const [course, setCourse] = useState(initialCourse)
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
  const [customerAlert, setCustomerAlert] = useState<CustomerAlert | null>(null)
  const [statusWindow, setStatusWindow] = useState<StatusWindowData | null>(null)
  const [availableCommands, setAvailableCommands] = useState<Command[]>([])
  const [courseCommands, setCourseCommands] = useState<Command[]>([])
  const [nextRamenId, setNextRamenId] = useState(1)
  const [laneCount, setLaneCount] = useState(1)
  const [existingBranches, setExistingBranches] = useState<string[]>(['main'])

  useEffect(() => { laneCountRef.current = laneCount }, [laneCount])
  useEffect(() => { nextRamenIdRef.current = nextRamenId }, [nextRamenId])
  useEffect(() => { ramensRef.current = ramens }, [ramens])

  const laneCountRef = useRef<number>(1)
  const nextRamenIdRef = useRef<number>(1)
  const ramensRef = useRef<Ramen[]>([])

  const getLaneRamens = (lane: number) => {
    return selectLaneRamens(ramens, lane)
  }

  const getActiveRamen = () => {
    return selectActiveRamen(ramens)
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
    setShowHelp(false)
    setIsPaused(false)
    setMessage('▶ ゲーム再開！')
  }

  const closeLog = () => {
    setShowLog(false)
  }

  const startOrderFromPull = (): string => {
    const payload = createLaneAwarePullOrderPayload({
      course,
      ramenId: nextRamenIdRef.current,
      laneCount: laneCountRef.current,
      maxLanes: MAX_LANES,
      existingBranches,
    })
    const newRamen = createRamenEntry({
      id: nextRamenIdRef.current,
      command: payload.command,
      steps: payload.runtimeLogic.steps,
      laneCount: laneCountRef.current,
      speed: RAMEN_SPEED,
      targetLaneOverride: payload.targetLaneOverride,
    })

    setRamens(prev => [...prev, newRamen])
    ramensRef.current = [...ramensRef.current, newRamen]
    nextRamenIdRef.current = nextRamenIdRef.current + 1
    setNextRamenId(nextRamenIdRef.current)
    appendOrderLog(newRamen)

    if (payload.noticeTitle) {
      setStatusWindow({
        title: payload.noticeTitle,
        phaseMessage: payload.orderText,
        details: payload.noticeDetails ?? [],
      })
      setTimeout(() => setStatusWindow(null), 2600)
    }

    return `📥 注文受付！「${payload.orderText}」 ${newRamen.currentLane}レーンで調理開始`
  }

  const startGame = async () => {
    setIsLoading(true)
    setTimeRemaining(GAME_TIME_LIMIT)
    setIsGameOver(false)
    setRamens([])
    setNextRamenId(1)
    setLaneCount(1)
    setExistingBranches(['main'])
    setShowLog(false)
    setIsCompactLog(false)
    setIsPaused(false)
    setCustomerAlert(null)
    setOrderLogs([])
    laneCountRef.current = 1
    nextRamenIdRef.current = 1
    ramensRef.current = []

    try {
      const [commands, catalog] = await Promise.all([
        fetchCommandsByCourse(course, 20),
        fetchCommandCatalogByCourse(course),
      ])

      if (!commands || commands.length === 0) {
        setMessage('❌ コマンドが取得できませんでした')
        return
      }

      setAvailableCommands(commands)
      setCourseCommands(catalog)
      setMessage(`🎮 コース ${course} スタート！まずは git pull で注文を受けてください（git log で履歴確認可）`)
    } catch (error) {
      console.error('Failed to load commands:', error)
      setMessage('❌ サーバーに接続できません')
    } finally {
      setIsLoading(false)
    }
  }

  const gameOver = () => {
    setIsGameOver(true)
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
  }, [course])

  useGameTimer({
    isLoading,
    isGameOver,
    isPaused,
    setTimeRemaining,
    onTimeout: gameOver,
  })

  useRamenMovement({
    isLoading,
    isGameOver,
    isPaused,
    course,
    soundSettings,
    setRamens,
    setScore,
    setMessage,
    setCustomerAlert,
    finalizeOrderLog,
  })

  const handleSubmit: FormOnSubmit = (e) => {
    e.preventDefault()

    const cmd = inputCommand.trim()
    const normalizedCmd = normalizeCommand(cmd)
    executeGameCommand({
      cmd,
      normalizedCmd,
      isGameOver,
      course,
      existingBranches,
      showHelp,
      availableCommands,
      availableItems: AVAILABLE_ITEMS,
      maxLanes: MAX_LANES,
      pushSpeed: PUSH_SPEED,
      onPullOrder: startOrderFromPull,
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
    })
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
    courseCommands,
    laneCount,
    existingBranches,
    orderLogs,
    isCompactLog,
    isPaused,
    customerAlert,
    statusWindow,
    resumeGame,
    closeLog,
  }
}
