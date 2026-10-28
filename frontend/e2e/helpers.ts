import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** モーダル（伝票・レシート）が出ていたら Enter で閉じる */
export async function dismissModal(page: Page) {
  if (await page.locator('.game-modal-backdrop').count()) {
    await page.keyboard.press('Enter')
    await expect(page.locator('.game-modal-backdrop')).toHaveCount(0)
  }
}

export async function runCommand(page: Page, command: string) {
  await dismissModal(page)
  const input = page.locator('input.command-input')
  await input.fill(command)
  await input.press('Enter')
}

/** 伝票に残っている手順を上から順に入力して1杯を捌く */
export async function serveCurrentOrder(page: Page) {
  for (let guard = 0; guard < 15; guard++) {
    await dismissModal(page)
    const remaining = page.locator('.receipt-slip-command:not(.receipt-slip-command-completed)')
    if (await remaining.count() === 0) return
    const raw = (await remaining.first().textContent()) ?? ''
    const command = raw.replace(/^\s*\d+\.\s*/, '').trim()
    if (!command) return
    await runCommand(page, command)
  }
  throw new Error('注文を15コマンド以内に捌けませんでした')
}
