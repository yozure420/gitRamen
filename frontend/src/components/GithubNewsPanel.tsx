import { useEffect, useState } from 'react'
import '../css/GithubNewsPanel.css'
import { fetchNews } from '../api/news'
import type { NewsItem, NewsResponse } from '../api/news'

type TabKey = 'upstream' | 'gitramen'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upstream', label: 'Git / GitHub' },
  { key: 'gitramen', label: 'GitRamen' },
]

/** githubstatus.com の indicator を表示用のラベルと色に対応させる */
const STATUS_LABEL: Record<string, string> = {
  none: '正常稼働中',
  minor: '一部で障害',
  major: '障害発生中',
  critical: '重大な障害',
  maintenance: 'メンテナンス中',
  unknown: '状況不明',
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ja-JP')
}

/** 日付があるものを新しい順に、日付がないものは後ろにまとめる */
function sortByPublished(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    if (!a.published_at) return b.published_at ? 1 : 0
    if (!b.published_at) return -1
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })
}

function GithubNewsPanel() {
  const [news, setNews] = useState<NewsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('upstream')

  useEffect(() => {
    let cancelled = false
    fetchNews()
      .then(result => { if (!cancelled) setNews(result) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : '更新情報を取得できませんでした') })
    return () => { cancelled = true }
  }, [])

  const indicator = news?.status?.indicator ?? 'unknown'
  const statusLabel = news?.status ? (STATUS_LABEL[indicator] ?? news.status.description) : STATUS_LABEL.unknown
  const items = news
    ? (activeTab === 'upstream' ? sortByPublished([...news.git, ...news.github]) : sortByPublished(news.gitramen))
    : []
  const failedSources = news?.unavailable.filter(source => source !== 'status') ?? []

  return (
    <aside className="news-panel" aria-label="Git / GitHub の更新情報">
      <div className="news-panel-header">
        <h2 className="news-panel-title">更新情報</h2>
        <span className={`news-status news-status--${indicator}`} title={news?.status?.description ?? ''}>
          <span className="news-status-dot" aria-hidden="true" />
          GitHub: {statusLabel}
        </span>
      </div>

      {news?.status && news.status.components.length > 0 && (
        <ul className="news-status-components">
          {news.status.components.map(component => (
            <li key={component.name} className={`news-status-component news-status-component--${component.status}`}>
              {component.name}
            </li>
          ))}
        </ul>
      )}

      <div className="news-tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`news-tab ${activeTab === tab.key ? 'news-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="news-body">
        {error && <p className="news-message">{error}</p>}
        {!error && !news && <p className="news-message">読み込み中…</p>}
        {!error && news && items.length === 0 && <p className="news-message">表示できる更新情報がありません</p>}

        <ul className="news-list">
          {items.map(item => (
            <li key={`${item.source}:${item.url}`} className="news-item">
              <a className="news-item-link" href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
              <div className="news-item-meta">
                <span className={`news-item-source news-item-source--${item.source}`}>{item.source}</span>
                {formatDate(item.published_at) && <span className="news-item-date">{formatDate(item.published_at)}</span>}
              </div>
            </li>
          ))}
        </ul>

        {failedSources.length > 0 && (
          <p className="news-message news-message--warn">一部の情報を取得できませんでした（{failedSources.join(', ')}）</p>
        )}
      </div>
    </aside>
  )
}

export default GithubNewsPanel
