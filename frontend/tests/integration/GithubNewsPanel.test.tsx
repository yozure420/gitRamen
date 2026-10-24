// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import GithubNewsPanel from '../../src/components/GithubNewsPanel'
import type { NewsResponse } from '../../src/api/news'

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

afterEach(cleanup)

describe('GithubNewsPanel', () => {
  it('news が無いときは読み込み中を表示し、news が渡されたら Git / GitHub の更新を新しい順で並べる', () => {
    const { rerender } = render(<GithubNewsPanel news={null} error={null} />)

    expect(screen.getByText('読み込み中…')).toBeTruthy()

    rerender(<GithubNewsPanel news={response} error={null} />)
    expect(screen.queryByText('読み込み中…')).toBeNull()
    expect(screen.getByText('GitHub Actions の更新')).toBeTruthy()
    // 日付ありが先、日付なし（Git タグ）が後ろ
    const titles = Array.from(document.querySelectorAll('.news-item-link')).map(el => el.textContent)
    expect(titles).toEqual(['GitHub Actions の更新', 'Git 2.51.0 がリリースされました'])
    expect(screen.queryByText('feat: ニュース欄を追加')).toBeNull()
  })

  it('タブを切り替えると「このゲームの更新」を表示する', () => {
    const { container } = render(<GithubNewsPanel news={response} error={null} />)
    expect(screen.getByText('GitHub Actions の更新')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'このゲームの更新' }))

    expect(screen.getByText('feat: ニュース欄を追加')).toBeTruthy()
    expect(screen.queryByText('GitHub Actions の更新')).toBeNull()
    expect(container.querySelector('.news-tab--active')?.textContent).toBe('このゲームの更新')
  })

  it('API が status を返しても稼働状況の表示は出さない', () => {
    const { container } = render(<GithubNewsPanel news={response} error={null} />)

    expect(screen.getByText('GitHub Actions の更新')).toBeTruthy()
    expect(container.querySelector('.news-status')).toBeNull()
    expect(container.querySelector('.news-status-components')).toBeNull()
    expect(screen.queryByText(/正常稼働中/)).toBeNull()
    expect(screen.queryByText('Git Operations')).toBeNull()
  })

  it('タブのラベルは日本語で表示される', () => {
    render(<GithubNewsPanel news={response} error={null} />)

    expect(screen.getByRole('tab', { name: 'Git と GitHub の更新' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'このゲームの更新' })).toBeTruthy()
  })

  it('記事の出どころを日本語のラベルで表示する', () => {
    const { container } = render(<GithubNewsPanel news={response} error={null} />)
    expect(screen.getByText('GitHub Actions の更新')).toBeTruthy()

    expect(container.querySelector('.news-item-source--github')?.textContent).toBe('GitHub 新機能')
    expect(container.querySelector('.news-item-source--git')?.textContent).toBe('Git 新バージョン')

    fireEvent.click(screen.getByRole('tab', { name: 'このゲームの更新' }))
    expect(container.querySelector('.news-item-source--gitramen')?.textContent).toBe('ゲーム更新')
  })

  it('一部のソースが取得できなかったときは注意書きを出す', () => {
    render(<GithubNewsPanel news={{ ...response, github: [], unavailable: ['github', 'status'] }} error={null} />)

    expect(screen.getByText(/一部の情報を取得できませんでした/)).toBeTruthy()
    // status の失敗は注意書きに含めず、ソース名は日本語ラベルで出す
    expect(screen.getByText(/（GitHub 新機能）/)).toBeTruthy()
  })

  it('取得に失敗したらエラーメッセージを表示する', () => {
    render(<GithubNewsPanel news={null} error="更新情報を取得できませんでした" />)

    expect(screen.getByText('更新情報を取得できませんでした')).toBeTruthy()
  })
})
