// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import GithubNewsPanel from '../../src/components/GithubNewsPanel'
import type { NewsItem, NewsResponse } from '../../src/api/news'

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

afterEach(cleanup)

describe('GithubNewsPanel の表示状態', () => {
  it('全ソースが空のときは「表示できる更新情報がありません」を出し、読み込み中は消える', () => {
    render(<GithubNewsPanel news={empty} error={null} />)

    expect(screen.getByText('表示できる更新情報がありません')).toBeTruthy()
    expect(screen.queryByText('読み込み中…')).toBeNull()
  })

  it('このゲームの更新タブだけが空のときもタブ単位で空表示になる', () => {
    render(<GithubNewsPanel news={{ ...empty, git: [item({ source: 'git', title: 'Git 2.51.0' })] }} error={null} />)
    expect(screen.getByText('Git 2.51.0')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'このゲームの更新' }))

    expect(screen.getByText('表示できる更新情報がありません')).toBeTruthy()
  })

  it('エラー時は読み込み中・空表示を出さない', () => {
    render(<GithubNewsPanel news={null} error="更新情報を取得できませんでした" />)

    expect(screen.getByText('更新情報を取得できませんでした')).toBeTruthy()
    expect(screen.queryByText('読み込み中…')).toBeNull()
    expect(screen.queryByText('表示できる更新情報がありません')).toBeNull()
  })

  it('status が null（取得失敗）でも一覧は表示され、稼働状況の表示は出ない', () => {
    const { container } = render(<GithubNewsPanel news={{
      ...empty,
      git: [item({ source: 'git', title: 'Git 2.51.0' })],
      status: null,
      unavailable: ['status'],
    }} error={null} />)

    expect(screen.getByText('Git 2.51.0')).toBeTruthy()
    expect(container.querySelector('.news-status')).toBeNull()
    expect(screen.queryByText(/状況不明/)).toBeNull()
    // status のみの失敗は一覧の注意書きに出さない
    expect(screen.queryByText(/一部の情報を取得できませんでした/)).toBeNull()
  })

  it('複数ソースの失敗は日本語ラベルを「、」区切りで注意書きにまとめる', () => {
    render(<GithubNewsPanel news={{ ...empty, unavailable: ['git', 'github', 'status'] }} error={null} />)

    expect(screen.getByText(/（Git 新バージョン、GitHub 新機能）/)).toBeTruthy()
  })

  it('不正な日付は日付表示を省き、リンクは別タブで noreferrer 付きで開く', () => {
    const { container } = render(<GithubNewsPanel news={{
      ...empty,
      github: [item({ title: 'bad date', url: 'https://example.test/bad', published_at: 'not-a-date' })],
    }} error={null} />)

    expect(screen.getByText('bad date')).toBeTruthy()
    expect(container.querySelector('.news-item-date')).toBeNull()
    const link = screen.getByRole('link', { name: 'bad date' })
    expect(link.getAttribute('href')).toBe('https://example.test/bad')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('日付のある項目は新しい順、日付なしは複数あっても後ろにまとまる', () => {
    const { container } = render(<GithubNewsPanel news={{
      ...empty,
      git: [
        item({ source: 'git', title: 'no-date-1', url: 'https://example.test/n1' }),
        item({ source: 'git', title: 'no-date-2', url: 'https://example.test/n2' }),
      ],
      github: [
        item({ title: 'old', url: 'https://example.test/old', published_at: '2025-01-01T00:00:00+00:00' }),
        item({ title: 'new', url: 'https://example.test/new', published_at: '2026-01-01T00:00:00+00:00' }),
      ],
    }} error={null} />)

    expect(screen.getByText('new')).toBeTruthy()
    const titles = Array.from(container.querySelectorAll('.news-item-link')).map(el => el.textContent)
    expect(titles).toEqual(['new', 'old', 'no-date-1', 'no-date-2'])
  })
})
