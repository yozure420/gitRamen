import './MyPage.css'
import { useState, useEffect } from 'react'
import { fetchMyPageStats, type MyPageData } from './api/mypage'

interface MyPageProps {
  token: string | null
  onCourseSelect: () => void
  onBackToTitle: () => void
}

function MyPage({ token, onCourseSelect, onBackToTitle }: MyPageProps) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [data, setData] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetchMyPageStats(token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="mypage-container">
        <div className="mypage-empty"><p>読み込み中...</p></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mypage-container">
        <div className="mypage-empty">
          <p>データを取得できませんでした</p>
          <button className="mypage-nav-btn" onClick={onBackToTitle}>タイトルに戻る</button>
        </div>
      </div>
    )
  }

  const maxMiss = data.missed_commands.length > 0
    ? Math.max(...data.missed_commands.map(m => m.total_miss))
    : 0

  return (
    <div className="mypage-container">
      {/* Header */}
      <header className="mypage-header">
        <h1 className="mypage-title">マイページ</h1>
        <span className="mypage-last-play">最終プレイ：{data.last_play ?? '---'}</span>
      </header>

      {/* Profile Card */}
      <div className="mypage-profile">
        <div className="mypage-profile-icon">
          <svg viewBox="0 0 92 92" width="56" height="56">
            <defs>
              <clipPath id="gitClip"><rect width="92" height="92" rx="14" fill="#fff"/></clipPath>
            </defs>
            <g clipPath="url(#gitClip)">
              <rect width="92" height="92" rx="14" fill="#f05133"/>
              <path fill="#fff" d="M85.5 42.7 49.3 6.5a4.5 4.5 0 0 0-6.4 0L34 15.4l8.1 8.1a5.4 5.4 0 0 1 6.8 6.8l7.8 7.8a5.4 5.4 0 1 1-3.2 3l-7.3-7.3v19.2a5.4 5.4 0 1 1-4.4-.3V33.4a5.4 5.4 0 0 1-2.9-7.1l-8-8-21.1 21a4.5 4.5 0 0 0 0 6.4l36.2 36.2a4.5 4.5 0 0 0 6.4 0L85.5 49a4.5 4.5 0 0 0 0-6.4z"/>
            </g>
          </svg>
        </div>
        <div className="mypage-profile-info">
          <div className="mypage-profile-name">{data.title}　{data.name}</div>
          <div className="mypage-profile-stats">
            <span className="mypage-stat">累計プレイ回数：{data.play_count}回</span>
            {data.accuracy !== null && (
              <span className="mypage-stat-highlight">正解率：{data.accuracy}%</span>
            )}
          </div>
        </div>
        <img src="images/ramen.png" alt="" className="mypage-profile-ramen" />
      </div>

      {/* Main Content */}
      <div className="mypage-content">
        {/* Command Miss History */}
        <div className="mypage-panel">
          <div className="mypage-panel-header">コマンドミス履歴</div>
          <div className="mypage-panel-body">
            {data.missed_commands.length === 0 ? (
              <p className="mypage-panel-empty">ミスなし</p>
            ) : (() => {
              const yMax = maxMiss + 1
              const ticks = Array.from({ length: yMax + 1 }, (_, i) => i)
              return (
                <div className="mypage-chart-wrapper">
                  <div className="mypage-chart-yaxis">
                    {ticks.reverse().map(v => (
                      <span key={v} className="mypage-chart-ylabel">{v}</span>
                    ))}
                  </div>
                  <div className="mypage-chart-area">
                    <div className="mypage-chart-gridlines">
                      {Array.from({ length: yMax + 1 }, (_, i) => (
                        <div key={i} className="mypage-chart-gridline" />
                      ))}
                    </div>
                    <div className="mypage-chart-bars">
                      {data.missed_commands.map((m, i) => (
                        <div key={i} className="mypage-chart-bar-col">
                          <div className="mypage-chart-bar-track">
                            <div
                              className="mypage-chart-bar-fill"
                              style={{ height: `${(m.total_miss / yMax) * 100}%` }}
                            />
                          </div>
                          <code className="mypage-chart-label">{m.command}</code>
                        </div>
                      ))}
                    </div>
                    <div className="mypage-chart-xaxis" />
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Play History */}
        <div className="mypage-panel">
          <div className="mypage-panel-header">プレイ履歴</div>
          <div className="mypage-panel-body">
            {data.histories.length === 0 ? (
              <p className="mypage-panel-empty">プレイ履歴なし</p>
            ) : (
              <div className="mypage-battle-table">
                <div className="mypage-battle-th">日付</div>
                <div className="mypage-battle-th center">コース</div>
                <div className="mypage-battle-th right">スコア</div>
                {data.histories.map((h, i) => (
                  <div key={i} className="mypage-battle-row">
                    <div className="mypage-battle-td">
                      {new Date(h.played_at).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="mypage-battle-td center">
                      {h.course ?? '---'}
                    </div>
                    <div className="mypage-battle-td right win">
                      {h.score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mypage-bottom-nav">
        <button
          className={`mypage-nav-btn ${hoveredBtn === 'course' ? 'active' : ''}`}
          onClick={onCourseSelect}
          onMouseEnter={() => setHoveredBtn('course')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          コース選択
        </button>
        <button
          className={`mypage-nav-btn ${hoveredBtn === 'title' ? 'active' : ''}`}
          onClick={onBackToTitle}
          onMouseEnter={() => setHoveredBtn('title')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          タイトルに戻る
        </button>
      </div>
    </div>
  )
}

export default MyPage
