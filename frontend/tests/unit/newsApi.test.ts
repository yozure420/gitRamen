import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNews } from '../../src/api/news'
import type { NewsResponse } from '../../src/api/news'

const body: NewsResponse = {
  git: [{ source: 'git', title: 'Git 2.51.0 がリリースされました', url: 'https://example.test/git', published_at: null }],
  github: [],
  gitramen: [],
  status: { indicator: 'none', description: 'All Systems Operational', components: [] },
  unavailable: [],
  fetched_at: '2026-09-16T00:00:00+00:00',
}

const fetchMock = vi.fn<(url: string) => Promise<Response>>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('fetchNews', () => {
  it('/api/news を取得して JSON を返す', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => body } as Response)

    await expect(fetchNews()).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith('/api/news')
  })

  it('エラーレスポンスなら例外を投げる', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) } as Response)

    await expect(fetchNews()).rejects.toThrow('更新情報を取得できませんでした')
  })
})

describe('fetchNews の失敗時の挙動', () => {
  it('ネットワークエラー（fetch の reject）はそのまま呼び出し元へ伝わる', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchNews()).rejects.toThrow('Failed to fetch')
  })

  it('本文が JSON として壊れていれば例外を投げる', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('Unexpected token') } } as unknown as Response)

    await expect(fetchNews()).rejects.toThrow(SyntaxError)
  })
})
