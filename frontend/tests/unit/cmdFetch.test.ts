import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCommandCatalogByCourse, fetchCommandsByCourse, fetchPlayableCatalogUpToCourse } from '../../src/api/cmdFetch_1'
import type { Command } from '../../src/types/interface'

const cmd = (id: number, course: number, extra: Partial<Command> = {}): Command => ({
  id, course, command: `git cmd${id}`, description: 'd', playable: true, ...extra,
})

const jsonResponse = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response

const fetchMock = vi.fn<(url: string) => Promise<Response>>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('cmdFetch', () => {
  it('出題用コマンドは playable_only 付きで取得し、他コース・操作不可を除外する', async () => {
    fetchMock.mockResolvedValue(jsonResponse([cmd(1, 2), cmd(2, 1), cmd(3, 2, { playable: false })]))

    const commands = await fetchCommandsByCourse(2, 5)

    expect(fetchMock).toHaveBeenCalledWith('/api/commands/random?course=2&count=5&playable_only=true')
    expect(commands.map(c => c.id)).toEqual([1])
  })

  it('API がエラー（404 など）を返したら空配列', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'No commands found' }, false))
    await expect(fetchCommandsByCourse(3)).resolves.toEqual([])
    await expect(fetchCommandCatalogByCourse(3)).resolves.toEqual([])
  })

  it('配列以外のレスポンスも空配列として扱う', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }))
    await expect(fetchCommandCatalogByCourse(1)).resolves.toEqual([])
  })

  it('ヘルプ用カタログは 1〜指定コースを順に連結する', async () => {
    fetchMock.mockImplementation(async (url) => {
      const course = Number(new URL(url, 'http://localhost').searchParams.get('course'))
      return jsonResponse([cmd(course * 10, course)])
    })

    const catalog = await fetchPlayableCatalogUpToCourse(3)

    expect(catalog.map(c => c.course)).toEqual([1, 2, 3])
    expect(fetchMock).toHaveBeenCalledWith('/api/commands/course?course=2&playable_only=true')
  })
})
