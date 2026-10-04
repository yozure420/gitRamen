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

const FETCH_ERROR_MESSAGE = '更新情報を取得できませんでした'
const NEWS_SOURCES: readonly string[] = ['git', 'github', 'gitramen']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNewsItem(value: unknown): value is NewsItem {
  return isRecord(value)
    && typeof value.source === 'string' && NEWS_SOURCES.includes(value.source)
    && typeof value.title === 'string'
    // href に入れるので http(s) 以外（javascript: など）は通さない
    && typeof value.url === 'string' && /^https?:\/\//.test(value.url)
    && (value.published_at === null || typeof value.published_at === 'string')
}

function isNewsItems(value: unknown): value is NewsItem[] {
  return Array.isArray(value) && value.every(isNewsItem)
}

function isGithubStatus(value: unknown): value is GithubStatus {
  return isRecord(value)
    && typeof value.indicator === 'string'
    && typeof value.description === 'string'
    && Array.isArray(value.components)
    && value.components.every(c => isRecord(c) && typeof c.name === 'string' && typeof c.status === 'string')
}

/** 応答の形を確かめる。想定外の形のまま描画するとタイトル画面ごと落ちるため、ここで弾く */
export function parseNewsResponse(value: unknown): NewsResponse {
  if (
    !isRecord(value)
    || !isNewsItems(value.git)
    || !isNewsItems(value.github)
    || !isNewsItems(value.gitramen)
    || !(value.status === null || isGithubStatus(value.status))
    || !Array.isArray(value.unavailable) || !value.unavailable.every(s => typeof s === 'string')
    || typeof value.fetched_at !== 'string'
  ) {
    throw new Error(FETCH_ERROR_MESSAGE)
  }
  return {
    git: value.git,
    github: value.github,
    gitramen: value.gitramen,
    status: value.status,
    unavailable: value.unavailable,
    fetched_at: value.fetched_at,
  }
}

/** Git / GitHub / GitRamen の更新情報と GitHub の稼働状況を取得する */
export async function fetchNews(): Promise<NewsResponse> {
  const res = await fetch(`${API_BASE_URL}/news`)
  if (!res.ok) {
    throw new Error(FETCH_ERROR_MESSAGE)
  }
  return parseNewsResponse(await res.json())
}
