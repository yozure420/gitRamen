// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNews } from '../../src/hooks/useNews'

// fetchNews は本物を使い、fetch だけを差し替える（形の検証を通した結果を確認する）
const fetchMock = vi.fn<(url: string) => Promise<Response>>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('useNews が想定外の応答を受けたとき', () => {
  it('形が違う応答は error になり、news は null のまま', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ git: null, status: 5 }) } as Response)
    const { result } = renderHook(() => useNews())

    await waitFor(() => expect(result.current.error).toBe('更新情報を取得できませんでした'))
    expect(result.current.news).toBeNull()
  })

  it('javascript: の url を含む応答は news に入れず error にする', async () => {
    const body = {
      git: [{ source: 'git', title: 'evil', url: 'javascript:alert(1)', published_at: null }],
      github: [],
      gitramen: [],
      status: null,
      unavailable: [],
      fetched_at: '2026-09-16T00:00:00+00:00',
    }
    fetchMock.mockResolvedValue({ ok: true, json: async () => body } as Response)
    const { result } = renderHook(() => useNews())

    await waitFor(() => expect(result.current.error).toBe('更新情報を取得できませんでした'))
    expect(result.current.news).toBeNull()
  })
})
