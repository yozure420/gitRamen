import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mockApi } from './fixtures'

const toggle = (page: Page) => page.getByRole('button', { name: '更新情報', exact: true })
const panelOf = (page: Page) => page.getByRole('complementary', { name: 'Git / GitHub の更新情報' })

async function startGame(page: Page) {
  await page.goto('/start')
  await page.locator('input.terminal-input').fill('git clone easy')
  await page.locator('input.terminal-input').press('Enter')
  await expect(page).toHaveURL(/\/game$/)
}

test.describe('ゲーム画面の更新情報（伝票欄）', () => {
  test('タイトル画面には更新情報パネルが出ない', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    await expect(page.getByRole('button', { name: 'スタート' })).toBeVisible()
    await expect(panelOf(page)).toHaveCount(0)
  })

  for (const width of [600, 900, 1280]) {
    test(`幅 ${width}px でもボタンが画面内にあり押せる`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await mockApi(page)
      await page.goto('/game')

      await expect(toggle(page)).toBeInViewport({ ratio: 1 })
      await toggle(page).click()
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    })
  }

  test('初期状態では伝票に更新情報が出ていて、ボタンは押された状態', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')

    const panel = panelOf(page)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.receipt-slip-waiting')).toContainText('git pull')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('GitHub: 正常稼働中')).toBeVisible()
    await expect(panel.getByText('Git Operations')).toBeVisible()
    await expect(panel.getByRole('link', { name: 'GitHub Actions の更新' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Git 2.51.0 がリリースされました' })).toBeVisible()
  })

  test('ボタンを押すと更新情報が消え、もう一度押すと再表示される', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')
    await expect(panelOf(page)).toBeVisible()

    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await expect(panelOf(page)).toHaveCount(0)
    await expect(page.locator('.receipt-slip-waiting')).toContainText('git pull')

    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(panelOf(page)).toBeVisible()
  })

  test('タブで GitRamen の更新に切り替えられる', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')

    const panel = panelOf(page)
    await panel.getByRole('tab', { name: 'GitRamen' }).click()

    await expect(panel.getByRole('link', { name: 'feat: 更新情報の欄を追加' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'GitHub Actions の更新' })).toBeHidden()
  })

  test('git pull で注文が入ると更新情報が消える', async ({ page }) => {
    await mockApi(page)
    await startGame(page)
    await expect(panelOf(page)).toBeVisible()

    const input = page.locator('input.command-input')
    await input.fill('git pull')
    await input.press('Enter')

    await expect(page.locator('.receipt-slip-command').first()).toBeVisible()
    await expect(panelOf(page)).toHaveCount(0)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
  })

  test('取得に失敗してもゲーム画面は操作できる', async ({ page }) => {
    await mockApi(page, { news: 'error' })
    await page.goto('/game')

    await expect(page.getByText('更新情報を取得できませんでした')).toBeVisible()
    await page.getByRole('button', { name: /タイトルへ戻る/ }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
