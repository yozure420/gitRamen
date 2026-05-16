import type { CommandStep, Ramen } from '../../types/interface'

export type CreateRamenEntryParams = {
  id: number
  command: Ramen['command']
  steps: CommandStep[]
  laneCount: number
  speed: number
  targetLaneOverride?: number | 'startLane'
}

export type CanSpawnRamenParams = {
  now: number
  lastSpawnAt: number
  ramens: Ramen[]
  minSpawnDelay: number
  minPositionGap: number
  maxRamens: number
}

export type DeliveryOutcome = {
  scoreDelta: number
  result: 'delivered' | 'failed'
  summary: string
  message: string
  customerWarning?: string
  errorLabel?: string
}
