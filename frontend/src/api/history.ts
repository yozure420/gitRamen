import { getToken } from './auth'

const API_BASE_URL = '/api'

export interface MissEntry {
  command_id: number
  miss_count: number
}

export interface MissedCommand {
  cmd: string
  count: number
}

export interface UserStats {
  username: string
  title: string
  total_plays: number
  best_score: number
  last_play: string | null
  missed_commands: MissedCommand[]
}

/**
 * ゲーム終了時に結果をバックエンドへ保存する。
 * 未ログイン（トークンなし）の場合は何もしない。
 */
export async function postHistory(course: number, score: number, misses: MissEntry[]): Promise<void> {
  const token = getToken()
  if (!token) return

  await fetch(`${API_BASE_URL}/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ course, score, misses }),
  })
}

/**
 * マイページ用の統計情報を取得する。
 */
export async function fetchUserStats(): Promise<UserStats> {
  const token = getToken()
  if (!token) throw new Error('ログインしていません')

  const res = await fetch(`${API_BASE_URL}/users/me/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? '統計情報の取得に失敗しました')
  }

  return res.json() as Promise<UserStats>
}
