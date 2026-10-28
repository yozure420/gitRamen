import { expect, test } from '@playwright/test'
import { mockApi } from './fixtures'
import { dismissModal, runCommand, serveCurrentOrder } from './helpers'

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
