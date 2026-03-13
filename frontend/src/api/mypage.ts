const API_BASE = 'http://localhost:8000'

// --- 型定義 ---

export interface MissedCommand {
    command: string
    total_miss: number
}

export interface HistoryRecord {
    id: number
    played_at: string
    score: number
    course: string | null
}

export interface MyPageData {
    name: string
    title: string
    play_count: number
    accuracy: number | null
    last_play: string | null
    missed_commands: MissedCommand[]
    histories: HistoryRecord[]
}

// --- API呼び出し ---

export async function fetchMyPageStats(token: string): Promise<MyPageData> {
    const res = await fetch(`${API_BASE}/mypage/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('マイページ情報の取得に失敗しました')
    return res.json()
}
