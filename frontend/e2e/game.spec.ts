import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mockApi } from './fixtures'

/** モーダル（伝票・レシート）が出ていたら Enter で閉じる */
async function dismissModal(page: Page) {
  if (await page.locator('.game-modal-backdrop').count()) {
    await page.keyboard.press('Enter')
    await expect(page.locator('.game-modal-backdrop')).toHaveCount(0)
  }
}

async function runCommand(page: Page, command: string) {
  await dismissModal(page)
  const input = page.locator('input.command-input')
  await input.fill(command)
  await input.press('Enter')
}

/** 伝票に残っている手順を上から順に入力して1杯を捌く */
async function serveCurrentOrder(page: Page) {
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

test.describe('ゲーム本編の通し操作', () => {
  test('git clone easy で開始して、1杯を配達できる', async ({ page }) => {
    await mockApi(page)
    await page.goto('/start')

    await page.locator('input.terminal-input').fill('git clone easy')
    await page.locator('input.terminal-input').press('Enter')

    await expect(page).toHaveURL(/\/game$/)
    await expect(page.locator('.receipt-slip-waiting')).toContainText('git pull')

    await runCommand(page, 'git pull')
    await serveCurrentOrder(page)

    await expect(page.locator('.score')).not.toContainText('売上: 0')
  })

  test('normalモードの注文変更（amend）ギミックを最後まで捌ける', async ({ page }) => {
    await mockApi(page)
    // 出題をギミック固定にして、毎回同じ手順を検証できるようにする
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__GITRAMEN_FORCE_ORDER_EVENT__ = 'amend'
    })
    await page.goto('/start')

    await page.locator('input.terminal-input').fill('git clone normal')
    await page.locator('input.terminal-input').press('Enter')
    await expect(page).toHaveURL(/\/game$/)

    await runCommand(page, 'git pull')

    // 手順に git commit --amend が含まれる注文になっている
    await dismissModal(page)
    await expect(page.locator('.receipt-slip-command', { hasText: 'git commit --amend' })).toBeVisible()

    await serveCurrentOrder(page)

    await expect(page.locator('.score')).not.toContainText('売上: 0')
  })

  test('git help でコマンド一覧が開く', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')

    await runCommand(page, 'git help')

    await expect(page.locator('.hint-title')).toContainText('コマンド一覧')
    await expect(page.locator('.course-command-item').first()).toBeVisible()
  })
})
