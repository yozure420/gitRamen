import { expect, test } from '@playwright/test'
import { mockApi } from './fixtures'

test.describe('タイトル画面の更新情報欄', () => {
  test('Git / GitHub の更新と GitHub の稼働状況を表示する', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    const panel = page.getByRole('complementary', { name: 'Git / GitHub の更新情報' })
    await expect(panel).toBeVisible()
    await expect(panel.getByText('GitHub: 正常稼働中')).toBeVisible()
    await expect(panel.getByText('Git Operations')).toBeVisible()

    await expect(panel.getByRole('link', { name: 'GitHub Actions の更新' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Git 2.51.0 がリリースされました' })).toBeVisible()
  })

  test('タブで GitRamen の更新に切り替えられる', async ({ page }) => {
    await mockApi(page)
    await page.goto('/')

    const panel = page.getByRole('complementary', { name: 'Git / GitHub の更新情報' })
    await panel.getByRole('tab', { name: 'GitRamen' }).click()

    await expect(panel.getByRole('link', { name: 'feat: 更新情報の欄を追加' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'GitHub Actions の更新' })).toBeHidden()
  })

  test('取得に失敗してもタイトル画面は操作できる', async ({ page }) => {
    await mockApi(page, { news: 'error' })
    await page.goto('/')

    await expect(page.getByText('更新情報を取得できませんでした')).toBeVisible()
    await page.getByRole('button', { name: 'スタート' }).click()
    await expect(page).toHaveURL(/\/start$/)
  })
})
