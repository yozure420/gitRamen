import type { Ramen } from '../../types/interface'
import type { CanSpawnRamenParams } from './types'

export function selectLaneRamens(ramens: Ramen[], lane: number): Ramen[] {
  return ramens.filter(r => r.currentLane === lane && !r.isCompleted)
}

export function selectActiveRamen(ramens: Ramen[]): Ramen | null {
  const activeRamens = ramens.filter(r => !r.isCompleted)
  if (activeRamens.length === 0) return null
  return activeRamens.reduce((prev, curr) => (prev.position > curr.position ? prev : curr))
}

export function canSpawnRamen(params: CanSpawnRamenParams): boolean {
  const { now, lastSpawnAt, ramens, minSpawnDelay, minPositionGap, maxRamens } = params
  const timeSinceLastSpawn = now - lastSpawnAt
  if (lastSpawnAt !== 0 && timeSinceLastSpawn < minSpawnDelay) {
    return false
  }

  const activeRamens = ramens.filter(r => !r.isCompleted)
  if (activeRamens.length >= maxRamens) {
    return false
  }

  if (activeRamens.length > 0) {
    const minPosition = Math.min(...activeRamens.map(r => r.position))
    if (minPosition < minPositionGap) {
      return false
    }
  }

  return true
}
