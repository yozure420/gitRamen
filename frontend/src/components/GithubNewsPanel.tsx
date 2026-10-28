import { useState } from 'react'
import '../css/GithubNewsPanel.css'
import type { NewsItem, NewsSource } from '../api/news'
import type { NewsState } from '../hooks/useNews'

type TabKey = 'upstream' | 'gitramen'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upstream', label: 'Git と GitHub の更新' },
  { key: 'gitramen', label: 'このゲームの更新' },
]

/** 記事の出どころを表示用のラベルに対応させる */
const SOURCE_LABEL: Record<NewsSource, string> = {
  git: 'Git 新バージョン',
  github: 'GitHub 新機能',
  gitramen: 'ゲーム更新',
}

/** unavailable には未知のソース名も来うるので、知っているものだけ日本語にする */
function labelOfSource(source: string): string {
  return Object.hasOwn(SOURCE_LABEL, source) ? SOURCE_LABEL[source as NewsSource] : source
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

/** 取得は呼び出し側（useNews）が持ち、ここは表示だけを受け持つ */
function GithubNewsPanel({ news, error }: NewsState) {
  const [activeTab, setActiveTab] = useState<TabKey>('upstream')

  const items = news
    ? (activeTab === 'upstream' ? sortByPublished([...news.git, ...news.github]) : sortByPublished(news.gitramen))
    : []
  const failedSources = news?.unavailable.filter(source => source !== 'status') ?? []

  return (
    <aside className="news-panel" aria-label="Git / GitHub の更新情報">
      <div className="news-panel-header">
        <h2 className="news-panel-title">更新情報</h2>
      </div>

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
                <span className={`news-item-source news-item-source--${item.source}`}>{SOURCE_LABEL[item.source]}</span>
                {formatDate(item.published_at) && <span className="news-item-date">{formatDate(item.published_at)}</span>}
              </div>
            </li>
          ))}
        </ul>

        {failedSources.length > 0 && (
          <p className="news-message news-message--warn">一部の情報を取得できませんでした（{failedSources.map(labelOfSource).join('、')}）</p>
        )}
      </div>
    </aside>
  )
}

export default GithubNewsPanel
