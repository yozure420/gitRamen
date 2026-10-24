// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GithubNewsPanel from '../../src/components/GithubNewsPanel'

// fetchNews は本物を使い、fetch だけを差し替える（形の検証を通した結果を確認する）
const fetchMock = vi.fn<(url: string) => Promise<Response>>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(cleanup)

describe('GithubNewsPanel が想定外の応答を受けたとき', () => {
  it('形が違う応答ではエラー文言を出し、落ちない', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ git: null, status: 5 }) } as Response)
    render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('更新情報を取得できませんでした')).toBeTruthy())
    expect(screen.queryByText('読み込み中…')).toBeNull()
  })

  it('javascript: の url を含む応答はリンクを描画せずエラー文言を出す', async () => {
    const body = {
      git: [{ source: 'git', title: 'evil', url: 'javascript:alert(1)', published_at: null }],
      github: [],
      gitramen: [],
      status: null,
      unavailable: [],
      fetched_at: '2026-09-16T00:00:00+00:00',
    }
    fetchMock.mockResolvedValue({ ok: true, json: async () => body } as Response)
    const { container } = render(<GithubNewsPanel />)

    await waitFor(() => expect(screen.getByText('更新情報を取得できませんでした')).toBeTruthy())
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull()
    expect(screen.queryByText('evil')).toBeNull()
  })
})
