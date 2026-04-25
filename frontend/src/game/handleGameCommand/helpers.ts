import type { CommandStep, Ramen } from '../../types/interface'
import { getCurrentCommandStep } from '../gameEngin/workflow'

export function normalizeCommand(input: string): string {
  return input
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isExpectedInputMatch(step: CommandStep | null, input: string): boolean {
  return step?.expectedInputs.some((expected: string) => normalizeCommand(expected) === input) ?? false
}

export function isCurrentStepMatch(ramen: Ramen | null, input: string): boolean {
  const step = ramen ? getCurrentCommandStep(ramen) : null
  return isExpectedInputMatch(step, input)
}

export function getNextStepCommand(ramen: Ramen): string | null {
  return ramen.steps[ramen.currentStepIndex + 1]?.displayCommand ?? null
}

export function getBranchLane(branchName: string, existingBranches: string[]): number {
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

export function toBranchListText(existingBranches: string[]): string {
  return existingBranches
    .map((branch, index) => `${branch}(Lane ${index + 1})`)
    .join(', ')
}
