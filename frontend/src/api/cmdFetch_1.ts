import type { Command } from '../types/interface'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function fetchCommandList(url: string): Promise<Command[]> {
  const res = await fetch(url)
  // 該当コマンドなし（404）などは空リストとして扱う
  if (!res.ok) return []
  const data: unknown = await res.json()
  return Array.isArray(data) ? (data as Command[]) : []
}

/** 出題用: 指定コースのうちゲーム内で操作できるコマンドをランダムに取得する */
export async function fetchCommandsByCourse(
  course: number,
  count: number = 20
): Promise<Command[]> {
  const data = await fetchCommandList(
    `${API_BASE_URL}/commands/random?course=${course}&count=${count}&playable_only=true`
  )

  // Safety net: even if backend changes, keep only selected-level commands in UI.
  return data.filter(cmd => cmd.course === course && cmd.playable !== false)
}

export async function fetchCourse1Commands(): Promise<Command[]> {
  return fetchCommandsByCourse(1, 100)
}

/** ヘルプ用: 指定コースで操作できるコマンド一覧（ID順） */
export async function fetchCommandCatalogByCourse(course: number): Promise<Command[]> {
  return fetchCommandList(`${API_BASE_URL}/commands/course?course=${course}&playable_only=true`)
}

/** ヘルプ用: 上位コースは下位コースのコマンドも使うため、1〜course を連結して返す */
export async function fetchPlayableCatalogUpToCourse(course: number): Promise<Command[]> {
  const catalogs = await Promise.all(
    Array.from({ length: course }, (_, index) => fetchCommandCatalogByCourse(index + 1))
  )
  return catalogs.flat()
}
