import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mockApi } from './fixtures'

const toggle = (page: Page) => page.getByRole('button', { name: /更新情報/ })
const panelOf = (page: Page) => page.getByRole('complementary', { name: 'Git / GitHub の更新情報' })

test.describe('ゲーム画面の更新情報プルダウン', () => {
  test('タイトル画面には更新情報パネルが出ない', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    await expect(page.getByRole('button', { name: 'スタート' })).toBeVisible()
    await expect(panelOf(page)).toHaveCount(0)
  })

  for (const width of [600, 900, 1280]) {
    test(`幅 ${width}px でもボタンが画面内にあり開ける`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await mockApi(page)
      await page.goto('/game')

      await expect(toggle(page)).toBeInViewport({ ratio: 1 })
      await toggle(page).click()
      await expect(panelOf(page)).toBeVisible()
    })
  }

  test('開くまでパネルは表示されない', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')

    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(panelOf(page)).toHaveCount(0)
  })

  test('開くと Git / GitHub の更新と GitHub の稼働状況を表示する', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')

    await toggle(page).click()

    const panel = panelOf(page)
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('GitHub: 正常稼働中')).toBeVisible()
    await expect(panel.getByText('Git Operations')).toBeVisible()
    await expect(panel.getByRole('link', { name: 'GitHub Actions の更新' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Git 2.51.0 がリリースされました' })).toBeVisible()
  })

  test('タブで GitRamen の更新に切り替えられる', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')
    await toggle(page).click()

    const panel = panelOf(page)
    await panel.getByRole('tab', { name: 'GitRamen' }).click()

    await expect(panel.getByRole('link', { name: 'feat: 更新情報の欄を追加' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'GitHub Actions の更新' })).toBeHidden()
  })

  test('ボタンを再度押すと閉じる', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')
    await toggle(page).click()
    await expect(panelOf(page)).toBeVisible()

    await toggle(page).click()

    await expect(panelOf(page)).toHaveCount(0)
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('パネルの外側をクリックすると閉じる', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')
    await toggle(page).click()
    await expect(panelOf(page)).toBeVisible()

    await page.mouse.click(5, 400)

    await expect(panelOf(page)).toHaveCount(0)
  })

  test('パネルの内側をクリックしても閉じない', async ({ page }) => {
    await mockApi(page)
    await page.goto('/game')
    await toggle(page).click()

    await panelOf(page).getByText('GitHub: 正常稼働中').click()

    await expect(panelOf(page)).toBeVisible()
  })

  test('取得に失敗してもゲーム画面は操作できる', async ({ page }) => {
    await mockApi(page, { news: 'error' })
    await page.goto('/game')
    await toggle(page).click()

    await expect(page.getByText('更新情報を取得できませんでした')).toBeVisible()
    await page.getByRole('button', { name: /タイトルへ戻る/ }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
