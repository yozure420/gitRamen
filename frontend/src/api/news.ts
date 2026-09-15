const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export type NewsSource = 'git' | 'github' | 'gitramen'

export interface NewsItem {
  source: NewsSource
  title: string
  url: string
  published_at: string | null
}

export interface StatusComponent {
  name: string
  status: string
}

export interface GithubStatus {
  /** none / minor / major / critical / unknown */
  indicator: string
  description: string
  components: StatusComponent[]
}

export interface NewsResponse {
  git: NewsItem[]
  github: NewsItem[]
  gitramen: NewsItem[]
  status: GithubStatus | null
  /** 取得に失敗したソース名 */
  unavailable: string[]
  fetched_at: string
}

/** Git / GitHub / GitRamen の更新情報と GitHub の稼働状況を取得する */
export async function fetchNews(): Promise<NewsResponse> {
  const res = await fetch(`${API_BASE_URL}/news`)
  if (!res.ok) {
    throw new Error('更新情報を取得できませんでした')
  }
  return res.json() as Promise<NewsResponse>
}
