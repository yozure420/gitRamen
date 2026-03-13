import { useState, useEffect, useRef } from 'react'
import { fetchCommandCatalogByCourse, fetchCommandsByCourse } from '../api/cmdFetch_1'
import type { Command, Ramen, CommandHistory, OrderLog } from '../interface'
import { resolveRuntimeCommandLogic } from '../game/commandLogic'
import { executeGameCommand, normalizeCommand } from '../game/handleGameCommand'
import { canSpawnRamen, createRamenEntry, selectActiveRamen, selectLaneRamens } from '../game/gameEngine'
import { useGameTimer, useRamenMovement, useRamenSpawner } from './game/useGameEffects'
import type { SoundSettings } from '../Settings'

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

type UseGmScreenParams = {
  soundSettings: SoundSettings
}

export function useGmScreen({ soundSettings }: UseGmScreenParams) {
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
  const [courseCommands, setCourseCommands] = useState<Command[]>([])
  const [nextRamenId, setNextRamenId] = useState(1)
  const [laneCount, setLaneCount] = useState(1)

  useEffect(() => { laneCountRef.current = laneCount }, [laneCount])
  useEffect(() => { nextRamenIdRef.current = nextRamenId }, [nextRamenId])
  useEffect(() => { ramensRef.current = ramens }, [ramens])

  const lastSpawnTimeRef = useRef<number>(0)
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

  const spawnRamen = (commands: Command[]) => {
    if (commands.length === 0) return

    const now = Date.now()
    if (!canSpawnRamen({
      now,
      lastSpawnAt: lastSpawnTimeRef.current,
      ramens: ramensRef.current,
      minSpawnDelay: MIN_SPAWN_DELAY,
      minPositionGap: MIN_POSITION_GAP,
      maxRamens: MAX_RAMENS,
    })) return

    const randomCommand = commands[Math.floor(Math.random() * commands.length)]
    const runtimeLogic = resolveRuntimeCommandLogic(randomCommand)
    const newRamen = createRamenEntry({
      id: nextRamenIdRef.current,
      command: randomCommand,
      displayCommand: runtimeLogic.displayCommand,
      expectedInputs: runtimeLogic.expectedInputs,
      logicLabel: runtimeLogic.logicLabel,
      logicDescription: runtimeLogic.logicDescription,
      logicExample: runtimeLogic.logicExample,
      laneCount: laneCountRef.current,
      speed: RAMEN_SPEED,
    })

    setRamens(prev => [...prev, newRamen])
    ramensRef.current = [...ramensRef.current, newRamen]
    setMessage(`🍜 新しいラーメン #${nextRamenIdRef.current}！Lane ${newRamen.currentLane} → Lane ${newRamen.targetLane} へ`)

    lastSpawnTimeRef.current = now
    nextRamenIdRef.current = nextRamenIdRef.current + 1
    setNextRamenId(nextRamenIdRef.current)
    appendOrderLog(newRamen)
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
    availableCommands,
    setRamens,
    setScore,
    setMessage,
    finalizeOrderLog,
    spawnRamen,
  })

  useRamenSpawner({
    isLoading,
    isGameOver,
    isPaused,
    availableCommands,
    spawnCheckInterval: SPAWN_CHECK_INTERVAL,
    spawnRamen,
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
      laneCount,
      showHelp,
      availableCommands,
      availableItems: AVAILABLE_ITEMS,
      maxLanes: MAX_LANES,
      pushSpeed: PUSH_SPEED,
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
    orderLogs,
    isCompactLog,
    isPaused,
    resumeGame,
  }
}
