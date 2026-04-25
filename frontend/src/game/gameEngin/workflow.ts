import type { CommandStep, Ramen } from '../../types/interface'

export function getCurrentCommandStep(ramen: Ramen): CommandStep | null {
  return ramen.steps[ramen.currentStepIndex] ?? null
}

export function isWorkflowCompleted(ramen: Ramen): boolean {
  return ramen.currentStepIndex >= ramen.steps.length
}

export function getWorkflowToppingItems(ramen: Ramen): string[] {
  return ramen.steps
    .filter(step => step.type === 'add' && step.itemName)
    .map(step => step.itemName as string)
}

export function advanceWorkflow(ramen: Ramen, overrides: Partial<Ramen> = {}): Ramen {
  const nextStepIndex = ramen.currentStepIndex + 1
  const nextStep = ramen.steps[nextStepIndex] ?? null

  return {
    ...ramen,
    ...overrides,
    currentStepIndex: nextStepIndex,
    displayCommand: nextStep?.displayCommand ?? ramen.displayCommand,
    expectedInputs: nextStep?.expectedInputs ?? [],
    logicLabel: nextStep?.logicLabel ?? ramen.logicLabel,
    logicDescription: nextStep?.logicDescription ?? ramen.logicDescription,
    logicExample: nextStep?.logicExample ?? ramen.logicExample,
    isPushReady: nextStep?.type === 'push',
    hasRequiredCommandExecuted: nextStepIndex >= ramen.steps.length,
  }
}

export function getRequiredToppingForRamen(ramen: Ramen): string | null {
  const currentStep = getCurrentCommandStep(ramen)
  if (!currentStep || currentStep.type !== 'add') {
    return null
  }
  const topping = currentStep.displayCommand.replace(/^git add\s+/i, '').trim()
  return topping || null
}
