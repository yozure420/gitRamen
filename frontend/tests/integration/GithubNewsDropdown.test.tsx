// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GithubNewsDropdown from '../../src/components/GithubNewsDropdown'
import { fetchNews } from '../../src/api/news'
import type { NewsResponse } from '../../src/api/news'

vi.mock('../../src/api/news', () => ({ fetchNews: vi.fn() }))

const fetchNewsMock = vi.mocked(fetchNews)

const response: NewsResponse = {
  git: [{ source: 'git', title: 'Git 2.51.0 がリリースされました', url: 'https://example.test/git', published_at: null }],
  github: [{ source: 'github', title: 'GitHub Actions の更新', url: 'https://example.test/gh', published_at: '2026-09-10T00:00:00+00:00' }],
  gitramen: [],
  status: { indicator: 'none', description: 'All Systems Operational', components: [] },
  unavailable: [],
  fetched_at: '2026-09-16T00:00:00+00:00',
}

const panelName = 'Git / GitHub の更新情報'

beforeEach(() => {
  fetchNewsMock.mockReset()
  fetchNewsMock.mockResolvedValue(response)
})
afterEach(cleanup)

describe('GithubNewsDropdown', () => {
  it('閉じている間はパネルを出さず、更新情報も取得しない', () => {
    render(<GithubNewsDropdown />)

    expect(screen.queryByRole('complementary', { name: panelName })).toBeNull()
    expect(screen.getByRole('button', { name: /更新情報/ }).getAttribute('aria-expanded')).toBe('false')
    expect(fetchNewsMock).not.toHaveBeenCalled()
  })

  it('ボタンを押すとパネルが開いて取得を始める', async () => {
    render(<GithubNewsDropdown />)

    fireEvent.click(screen.getByRole('button', { name: /更新情報/ }))

    expect(screen.getByRole('complementary', { name: panelName })).toBeTruthy()
    expect(screen.getByRole('button', { name: /更新情報/ }).getAttribute('aria-expanded')).toBe('true')
    await waitFor(() => expect(screen.getByText('GitHub Actions の更新')).toBeTruthy())
    expect(fetchNewsMock).toHaveBeenCalledTimes(1)
  })

  it('開いた状態でボタンを押すと閉じる', () => {
    render(<GithubNewsDropdown />)
    const button = screen.getByRole('button', { name: /更新情報/ })
    fireEvent.click(button)

    fireEvent.click(button)

    expect(screen.queryByRole('complementary', { name: panelName })).toBeNull()
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('外側を mousedown すると閉じる', () => {
    render(<GithubNewsDropdown />)
    fireEvent.click(screen.getByRole('button', { name: /更新情報/ }))

    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('complementary', { name: panelName })).toBeNull()
  })

  it('パネル内を mousedown しても閉じない', () => {
    render(<GithubNewsDropdown />)
    fireEvent.click(screen.getByRole('button', { name: /更新情報/ }))

    fireEvent.mouseDown(screen.getByRole('complementary', { name: panelName }))

    expect(screen.getByRole('complementary', { name: panelName })).toBeTruthy()
  })

  it('開き直すたびに更新情報を取得し直す', () => {
    render(<GithubNewsDropdown />)
    const button = screen.getByRole('button', { name: /更新情報/ })

    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(fetchNewsMock).toHaveBeenCalledTimes(2)
  })
})
