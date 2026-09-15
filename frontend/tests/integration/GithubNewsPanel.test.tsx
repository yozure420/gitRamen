// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GithubNewsPanel from '../../src/components/GithubNewsPanel'
import { fetchNews } from '../../src/api/news'
import type { NewsResponse } from '../../src/api/news'

vi.mock('../../src/api/news', () => ({ fetchNews: vi.fn() }))

const fetchNewsMock = vi.mocked(fetchNews)

const response: NewsResponse = {
  git: [{ source: 'git', title: 'Git 2.51.0 がリリースされました', url: 'https://example.test/git', published_at: null }],
  github: [{ source: 'github', title: 'GitHub Actions の更新', url: 'https://example.test/gh', published_at: '2026-09-10T00:00:00+00:00' }],
  gitramen: [{ source: 'gitramen', title: 'feat: ニュース欄を追加', url: 'https://example.test/commit', published_at: '2026-09-15T00:00:00+00:00' }],
  status: {
    indicator: 'none',
    description: 'All Systems Operational',
    components: [{ name: 'Git Operations', status: 'operational' }],
  },
  unavailable: [],
  fetched_at: '2026-09-16T00:00:00+00:00',
}

beforeEach(() => fetchNewsMock.mockReset())
afterEach(cleanup)

describe('GithubNewsPanel', () => {
  it('読み込み中を表示し、取得後に Git / GitHub の更新を新しい順で並べる', async () => {
    fetchNewsMock.mockResolvedValue(response)
    render(<GithubNewsPanel />)

    expect(screen.getByText('読み込み中…')).toBeTruthy()

    await waitFor(() => expect(screen.getByText('GitHub Actions の更新')).toBeTruthy())
    // 日付ありが先、日付なし（Git タグ）が後ろ
    const titles = Array.from(document.querySelectorAll('.news-item-link')).map(el => el.textContent)
    expect(titles).toEqual(['GitHub Actions の更新', 'Git 2.51.0 がリリースされました'])
    expect(screen.queryByText('feat: ニュース欄を追加')).toBeNull()
  })

  it('タブを切り替えると GitRamen の更新を表示する', async () => {
    fetchNewsMock.mockResolvedValue(response)
    const { container } = render(<GithubNewsPanel />)
    await waitFor(() => expect(screen.getByText('GitHub Actions の更新')).toBeTruthy())

    screen.getByRole('tab', { name: 'GitRamen' }).click()

    await waitFor(() => expect(screen.getByText('feat: ニュース欄を追加')).toBeTruthy())
    expect(screen.queryByText('GitHub Actions の更新')).toBeNull()
    expect(container.querySelector('.news-tab--active')?.textContent).toBe('GitRamen')
  })

  it('GitHub の稼働状況と監視対象コンポーネントを表示する', async () => {
    fetchNewsMock.mockResolvedValue(response)
    const { container } = render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText(/GitHub: 正常稼働中/)).toBeTruthy())
    expect(container.querySelector('.news-status--none')).toBeTruthy()
    expect(screen.getByText('Git Operations')).toBeTruthy()
  })

  it('障害発生中はステータス表示が変わる', async () => {
    fetchNewsMock.mockResolvedValue({
      ...response,
      status: { indicator: 'major', description: 'Major Service Outage', components: [{ name: 'Actions', status: 'major_outage' }] },
    })
    const { container } = render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText(/GitHub: 障害発生中/)).toBeTruthy())
    expect(container.querySelector('.news-status--major')).toBeTruthy()
    expect(container.querySelector('.news-status-component--major_outage')).toBeTruthy()
  })

  it('一部のソースが取得できなかったときは注意書きを出す', async () => {
    fetchNewsMock.mockResolvedValue({ ...response, github: [], unavailable: ['github', 'status'] })
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText(/一部の情報を取得できませんでした/)).toBeTruthy())
    // status の失敗はバッジ側で表現するので一覧の注意書きには含めない
    expect(screen.getByText(/（github）/)).toBeTruthy()
  })

  it('取得に失敗したらエラーメッセージを表示する', async () => {
    fetchNewsMock.mockRejectedValue(new Error('更新情報を取得できませんでした'))
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('更新情報を取得できませんでした')).toBeTruthy())
    expect(screen.getByText(/GitHub: 状況不明/)).toBeTruthy()
  })
})
