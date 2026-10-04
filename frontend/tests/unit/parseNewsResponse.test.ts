import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNews, parseNewsResponse } from '../../src/api/news'

const MESSAGE = '更新情報を取得できませんでした'

const validItem = { source: 'git', title: 't', url: 'https://example.test/a', published_at: null }

const valid = (): Record<string, unknown> => ({
  git: [validItem],
  github: [{ ...validItem, source: 'github', published_at: '2026-01-01T00:00:00+00:00' }],
  gitramen: [{ ...validItem, source: 'gitramen' }],
  status: {
    indicator: 'none',
    description: 'All Systems Operational',
    components: [{ name: 'Git Operations', status: 'operational' }],
  },
  unavailable: [],
  fetched_at: '2026-09-16T00:00:00+00:00',
})

const withOverride = (over: Record<string, unknown>) => ({ ...valid(), ...over })
const withItem = (over: Record<string, unknown>) => withOverride({ git: [{ ...validItem, ...over }] })
const without = (key: string) => {
  const body = valid()
  delete body[key]
  return body
}
const status = (over: Record<string, unknown>) =>
  withOverride({ status: { indicator: 'none', description: 'd', components: [], ...over } })

describe('parseNewsResponse の正常系', () => {
  it('正しい形の応答はそのまま通す', () => {
    const body = valid()
    expect(parseNewsResponse(body)).toEqual(body)
  })

  it('status が null でも通す', () => {
    expect(parseNewsResponse(withOverride({ status: null })).status).toBeNull()
  })

  it('各一覧が空配列でも通す', () => {
    const result = parseNewsResponse(withOverride({ git: [], github: [], gitramen: [], unavailable: ['git'] }))
    expect(result.git).toEqual([])
    expect(result.unavailable).toEqual(['git'])
  })

  it('http:// で始まる url も通す', () => {
    expect(() => parseNewsResponse(withItem({ url: 'http://example.test/a' }))).not.toThrow()
  })
})

describe('parseNewsResponse の異常系', () => {
  const invalidCases: Array<[string, unknown]> = [
    ['null', null],
    ['undefined', undefined],
    ['文字列', 'oops'],
    ['配列', []],
    ['git が欠落', without('git')],
    ['git が配列でない', withOverride({ git: {} })],
    ['github が null', withOverride({ github: null })],
    ['gitramen が配列でない', withOverride({ gitramen: 'x' })],
    ['status が欠落', without('status')],
    ['status が文字列', withOverride({ status: 'ok' })],
    ['status.indicator が数値', status({ indicator: 1 })],
    ['status.description が欠落', status({ description: undefined })],
    ['status.components が配列でない', status({ components: {} })],
    ['status.components の要素の name が非文字列', status({ components: [{ name: 1, status: 'x' }] })],
    ['status.components の要素が null', status({ components: [null] })],
    ['unavailable が配列でない', withOverride({ unavailable: 'git' })],
    ['unavailable に非文字列', withOverride({ unavailable: ['git', 1] })],
    ['fetched_at が欠落', without('fetched_at')],
    ['fetched_at が数値', withOverride({ fetched_at: 123 })],
    ['項目が null', withOverride({ git: [null] })],
    ['項目の source が未知', withItem({ source: 'twitter' })],
    ['項目の source が非文字列', withItem({ source: 1 })],
    ['項目の title が非文字列', withItem({ title: null })],
    ['項目の url が欠落', withItem({ url: undefined })],
    ['項目の url が javascript:', withItem({ url: 'javascript:alert(1)' })],
    ['項目の url が data:', withItem({ url: 'data:text/html,x' })],
    ['項目の url が相対パス', withItem({ url: '/relative' })],
    ['項目の url が ftp:', withItem({ url: 'ftp://example.test/a' })],
    ['項目の published_at が数値', withItem({ published_at: 1 })],
    ['項目の published_at が欠落', withItem({ published_at: undefined })],
  ]

  it.each(invalidCases)('%s なら例外を投げる', (_name, value) => {
    expect(() => parseNewsResponse(value)).toThrow(MESSAGE)
  })

  it('1件でも不正な項目が混ざっていれば全体を弾く', () => {
    expect(() => parseNewsResponse(withOverride({ git: [validItem, { ...validItem, url: 'javascript:x' }] }))).toThrow(MESSAGE)
  })
})

describe('fetchNews は応答の形を検証する', () => {
  const fetchMock = vi.fn<(url: string) => Promise<Response>>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('200 でも形が違えば reject する', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ git: 'nope' }) } as Response)

    await expect(fetchNews()).rejects.toThrow(MESSAGE)
  })

  it('200 で本文が null でも reject する', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => null } as Response)

    await expect(fetchNews()).rejects.toThrow(MESSAGE)
  })
})
