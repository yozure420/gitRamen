// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentUser, getToken, removeTokenIfUnauthorized, saveToken } from '../../src/api/auth'
import { fetchUserStats, postHistory } from '../../src/api/history'

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()

function respond(status: number) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ detail: 'x' }),
  } as Response)
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
  saveToken('jwt-token')
})

describe('removeTokenIfUnauthorized', () => {
  it('401 なら JWT を消す', () => {
    removeTokenIfUnauthorized({ status: 401 } as Response)
    expect(getToken()).toBeNull()
  })

  it('500 なら JWT を消さない', () => {
    removeTokenIfUnauthorized({ status: 500 } as Response)
    expect(getToken()).toBe('jwt-token')
  })
})

describe('fetchCurrentUser', () => {
  it('401 なら JWT を消して例外を投げる', async () => {
    respond(401)
    await expect(fetchCurrentUser()).rejects.toThrow('x')
    expect(getToken()).toBeNull()
  })

  it('500 なら JWT を残して例外を投げる', async () => {
    respond(500)
    await expect(fetchCurrentUser()).rejects.toThrow('x')
    expect(getToken()).toBe('jwt-token')
  })
})

describe('fetchUserStats', () => {
  it('401 なら JWT を消して例外を投げる', async () => {
    respond(401)
    await expect(fetchUserStats()).rejects.toThrow('x')
    expect(getToken()).toBeNull()
  })

  it('500 なら JWT を残して例外を投げる', async () => {
    respond(500)
    await expect(fetchUserStats()).rejects.toThrow('x')
    expect(getToken()).toBe('jwt-token')
  })
})

describe('postHistory', () => {
  it('401 なら JWT を消す', async () => {
    respond(401)
    await postHistory(1, 10, [])
    expect(getToken()).toBeNull()
  })

  it('500 なら JWT を残す', async () => {
    respond(500)
    await postHistory(1, 10, [])
    expect(getToken()).toBe('jwt-token')
  })

  it('成功（200）なら JWT を残す', async () => {
    respond(200)
    await postHistory(1, 10, [])
    expect(getToken()).toBe('jwt-token')
  })
})
