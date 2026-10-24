// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNews } from '../../src/hooks/useNews'
import { fetchNews } from '../../src/api/news'
import type { NewsResponse } from '../../src/api/news'

vi.mock('../../src/api/news', () => ({ fetchNews: vi.fn() }))

const fetchNewsMock = vi.mocked(fetchNews)

const response: NewsResponse = {
  git: [{ source: 'git', title: 'Git 2.51.0', url: 'https://example.test/git', published_at: null }],
  github: [],
  gitramen: [],
  status: null,
  unavailable: [],
  fetched_at: '2026-09-16T00:00:00+00:00',
}

// ブロックにしないと mockReset() の戻り値（モック関数）が Vitest の後処理として実行されてしまう
beforeEach(() => { fetchNewsMock.mockReset() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('useNews', () => {
  it('取得が終わるまでは news も error も null', () => {
    fetchNewsMock.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useNews())

    expect(result.current).toEqual({ news: null, error: null })
  })

  it('取得に成功したら news に入り、error は null', async () => {
    fetchNewsMock.mockResolvedValue(response)
    const { result } = renderHook(() => useNews())

    await waitFor(() => expect(result.current.news).toEqual(response))
    expect(result.current.error).toBeNull()
  })

  it('取得に失敗したら error にメッセージが入り、news は null', async () => {
    fetchNewsMock.mockRejectedValue(new Error('更新情報を取得できませんでした'))
    const { result } = renderHook(() => useNews())

    await waitFor(() => expect(result.current.error).toBe('更新情報を取得できませんでした'))
    expect(result.current.news).toBeNull()
  })

  it('Error 以外で reject されても既定のエラーメッセージになる', async () => {
    fetchNewsMock.mockRejectedValue('boom')
    const { result } = renderHook(() => useNews())

    await waitFor(() => expect(result.current.error).toBe('更新情報を取得できませんでした'))
  })

  it('再レンダーしても fetchNews は1回だけ', async () => {
    fetchNewsMock.mockResolvedValue(response)
    const { result, rerender } = renderHook(() => useNews())
    await waitFor(() => expect(result.current.news).not.toBeNull())

    rerender()
    rerender()

    expect(fetchNewsMock).toHaveBeenCalledTimes(1)
  })

  it('アンマウント後に成功が返っても警告を出さず、状態を更新しない', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let resolve!: (value: NewsResponse) => void
    fetchNewsMock.mockReturnValue(new Promise(r => { resolve = r }))
    const { result, unmount } = renderHook(() => useNews())

    unmount()
    resolve(response)
    await Promise.resolve()

    expect(result.current).toEqual({ news: null, error: null })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('アンマウント後に失敗が返っても警告を出さず、状態を更新しない', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let reject!: (reason: unknown) => void
    fetchNewsMock.mockReturnValue(new Promise((_, r) => { reject = r }))
    const { result, unmount } = renderHook(() => useNews())

    unmount()
    reject(new Error('late'))
    await Promise.resolve()

    expect(result.current).toEqual({ news: null, error: null })
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
