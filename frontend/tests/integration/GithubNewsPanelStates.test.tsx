// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GithubNewsPanel from '../../src/components/GithubNewsPanel'
import { fetchNews } from '../../src/api/news'
import type { NewsItem, NewsResponse } from '../../src/api/news'

vi.mock('../../src/api/news', () => ({ fetchNews: vi.fn() }))

const fetchNewsMock = vi.mocked(fetchNews)

const empty: NewsResponse = {
  git: [],
  github: [],
  gitramen: [],
  status: { indicator: 'none', description: 'All Systems Operational', components: [] },
  unavailable: [],
  fetched_at: '2026-09-16T00:00:00+00:00',
}

const item = (over: Partial<NewsItem>): NewsItem => ({
  source: 'github',
  title: 't',
  url: 'https://example.test/a',
  published_at: null,
  ...over,
})

beforeEach(() => { fetchNewsMock.mockReset() })
afterEach(cleanup)

describe('GithubNewsPanel の表示状態', () => {
  it('全ソースが空のときは「表示できる更新情報がありません」を出し、読み込み中は消える', async () => {
    fetchNewsMock.mockResolvedValue(empty)
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('表示できる更新情報がありません')).toBeTruthy())
    expect(screen.queryByText('読み込み中…')).toBeNull()
  })

  it('GitRamen タブだけが空のときもタブ単位で空表示になる', async () => {
    fetchNewsMock.mockResolvedValue({ ...empty, git: [item({ source: 'git', title: 'Git 2.51.0' })] })
    render(<GithubNewsPanel />)
    await waitFor(() => expect(screen.getByText('Git 2.51.0')).toBeTruthy())

    screen.getByRole('tab', { name: 'GitRamen' }).click()

    await waitFor(() => expect(screen.getByText('表示できる更新情報がありません')).toBeTruthy())
  })

  it('エラー時は読み込み中・空表示を出さない', async () => {
    fetchNewsMock.mockRejectedValue(new Error('更新情報を取得できませんでした'))
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('更新情報を取得できませんでした')).toBeTruthy())
    expect(screen.queryByText('読み込み中…')).toBeNull()
    expect(screen.queryByText('表示できる更新情報がありません')).toBeNull()
  })

  it('Error 以外で reject されても既定のエラーメッセージを表示する', async () => {
    fetchNewsMock.mockRejectedValue('boom')
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('更新情報を取得できませんでした')).toBeTruthy())
  })

  it('status が null（取得失敗）でも一覧は表示され、バッジは「状況不明」になる', async () => {
    fetchNewsMock.mockResolvedValue({
      ...empty,
      git: [item({ source: 'git', title: 'Git 2.51.0' })],
      status: null,
      unavailable: ['status'],
    })
    const { container } = render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('Git 2.51.0')).toBeTruthy())
    expect(screen.getByText(/GitHub: 状況不明/)).toBeTruthy()
    expect(container.querySelector('.news-status--unknown')).toBeTruthy()
    expect(container.querySelector('.news-status-components')).toBeNull()
    // status のみの失敗は一覧の注意書きに出さない
    expect(screen.queryByText(/一部の情報を取得できませんでした/)).toBeNull()
  })

  it('未知の indicator のときは API の description をバッジに使う', async () => {
    fetchNewsMock.mockResolvedValue({
      ...empty,
      status: { indicator: 'brand_new', description: 'Something Else', components: [] },
    })
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText(/GitHub: Something Else/)).toBeTruthy())
  })

  it('コンポーネントが空配列のときはコンポーネント一覧を描画しない', async () => {
    fetchNewsMock.mockResolvedValue(empty)
    const { container } = render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText(/GitHub: 正常稼働中/)).toBeTruthy())
    expect(container.querySelector('.news-status-components')).toBeNull()
  })

  it('複数ソースの失敗は注意書きにまとめて列挙する', async () => {
    fetchNewsMock.mockResolvedValue({ ...empty, unavailable: ['git', 'github', 'status'] })
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText(/（git, github）/)).toBeTruthy())
  })

  it('不正な日付は日付表示を省き、リンクは別タブで noreferrer 付きで開く', async () => {
    fetchNewsMock.mockResolvedValue({
      ...empty,
      github: [item({ title: 'bad date', url: 'https://example.test/bad', published_at: 'not-a-date' })],
    })
    const { container } = render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('bad date')).toBeTruthy())
    expect(container.querySelector('.news-item-date')).toBeNull()
    const link = screen.getByRole('link', { name: 'bad date' })
    expect(link.getAttribute('href')).toBe('https://example.test/bad')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('日付のある項目は新しい順、日付なしは複数あっても後ろにまとまる', async () => {
    fetchNewsMock.mockResolvedValue({
      ...empty,
      git: [
        item({ source: 'git', title: 'no-date-1', url: 'https://example.test/n1' }),
        item({ source: 'git', title: 'no-date-2', url: 'https://example.test/n2' }),
      ],
      github: [
        item({ title: 'old', url: 'https://example.test/old', published_at: '2025-01-01T00:00:00+00:00' }),
        item({ title: 'new', url: 'https://example.test/new', published_at: '2026-01-01T00:00:00+00:00' }),
      ],
    })
    const { container } = render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('new')).toBeTruthy())
    const titles = Array.from(container.querySelectorAll('.news-item-link')).map(el => el.textContent)
    expect(titles).toEqual(['new', 'old', 'no-date-1', 'no-date-2'])
  })
})
