import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import type { Command, Ramen } from '../../interface'
import { evaluateDelivery } from '../../game/gameEngine'
import type { SoundSettings } from '../../Settings'
import { playSound } from '../../Sounds'

type UseGameTimerParams = {
  isLoading: boolean
  isGameOver: boolean
  isPaused: boolean
  setTimeRemaining: Dispatch<SetStateAction<number>>
  onTimeout: () => void
}

export function useGameTimer({
  isLoading,
  isGameOver,
  isPaused,
  setTimeRemaining,
  onTimeout,
}: UseGameTimerParams) {
  const onTimeoutRef = useRef(onTimeout)
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    if (isLoading || isGameOver || isPaused) return

    const timerId = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onTimeoutRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(timerId)
    }
  }, [isLoading, isGameOver, isPaused, setTimeRemaining])
}

type UseRamenMovementParams = {
  isLoading: boolean
  isGameOver: boolean
  isPaused: boolean
  course: number
  soundSettings: SoundSettings
  availableCommands: Command[]
  setRamens: Dispatch<SetStateAction<Ramen[]>>
  setScore: Dispatch<SetStateAction<number>>
  setMessage: (value: string) => void
  finalizeOrderLog: (ramenId: number, result: 'delivered' | 'failed', summary: string) => void
  spawnRamen: (commands: Command[]) => void
}

export function useRamenMovement({
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
}: UseRamenMovementParams) {
  const finalizeOrderLogRef = useRef(finalizeOrderLog)
  const spawnRamenRef = useRef(spawnRamen)
  const soundSettingsRef = useRef(soundSettings)
  const resolvedRamenIdsRef = useRef<Set<number>>(new Set())
  useEffect(() => {
    finalizeOrderLogRef.current = finalizeOrderLog
  }, [finalizeOrderLog])
  useEffect(() => {
    spawnRamenRef.current = spawnRamen
  }, [spawnRamen])
  useEffect(() => {
    soundSettingsRef.current = soundSettings
  }, [soundSettings])
  useEffect(() => {
    if (isLoading) {
      resolvedRamenIdsRef.current.clear()
    }
  }, [isLoading])

  useEffect(() => {
    if (isLoading || isGameOver || isPaused) return

    const moveId = setInterval(() => {
      setRamens(prev => {
        return prev.map(ramen => {
          if (ramen.isCompleted) return ramen

          if (resolvedRamenIdsRef.current.has(ramen.id)) {
            return { ...ramen, position: 100, isCompleted: true }
          }

          const newPosition = Math.min(100, ramen.position + ramen.speed)

          if (newPosition >= 100) {
            resolvedRamenIdsRef.current.add(ramen.id)
            const outcome = evaluateDelivery(ramen, course)
            setScore(s => Math.max(0, s + outcome.scoreDelta))
            setMessage(outcome.message)
            playSound(outcome.result === 'delivered' ? 'se' : 'miss', soundSettingsRef.current)
            finalizeOrderLogRef.current(ramen.id, outcome.result, outcome.summary)
            setTimeout(() => {
              setRamens(p => p.filter(r => r.id !== ramen.id))
              resolvedRamenIdsRef.current.delete(ramen.id)
              setTimeout(() => {
                if (availableCommands.length > 0) {
                  spawnRamenRef.current(availableCommands)
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
      clearInterval(moveId)
    }
  }, [
    isLoading,
    isGameOver,
    isPaused,
    course,
    availableCommands,
    setRamens,
    setScore,
    setMessage,
  ])
}

type UseRamenSpawnerParams = {
  isLoading: boolean
  isGameOver: boolean
  isPaused: boolean
  availableCommands: Command[]
  spawnCheckInterval: number
  spawnRamen: (commands: Command[]) => void
}

export function useRamenSpawner({
  isLoading,
  isGameOver,
  isPaused,
  availableCommands,
  spawnCheckInterval,
  spawnRamen,
}: UseRamenSpawnerParams) {
  const spawnRamenRef = useRef(spawnRamen)
  useEffect(() => {
    spawnRamenRef.current = spawnRamen
  }, [spawnRamen])

  useEffect(() => {
    if (isLoading || isGameOver || isPaused || availableCommands.length === 0) return

    const spawnId = setInterval(() => {
      spawnRamenRef.current(availableCommands)
    }, spawnCheckInterval)

    return () => {
      clearInterval(spawnId)
    }
  }, [isLoading, isGameOver, isPaused, availableCommands, spawnCheckInterval])
}
