import '../css/MyPage.css'
import { useState, useEffect } from 'react'
import ramenImage from '../assets/ramen/ramen.png'
import { fetchUserStats } from '../api/history'
import type { UserStats } from '../api/history'

interface MyPageProps {
    onCourseSelect: () => void
    onBackToTitle: () => void
}

function MyPage({ onCourseSelect, onBackToTitle }: MyPageProps) {
    const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
    const [stats, setStats] = useState<UserStats | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchUserStats()
            .then(setStats)
            .catch(err => setError(err instanceof Error ? err.message : '取得に失敗しました'))
    }, [])

    const missedCommands = stats?.missed_commands ?? []
    const maxMiss = missedCommands.length > 0 ? Math.max(...missedCommands.map(c => c.count)) : 0

    return (
    <div className="mypage-container">
        {/* Header */}
        <header className="mypage-header">
            <h1 className="mypage-title">マイページ</h1>
            <span className="mypage-last-play">
                最終プレイ：{stats?.last_play ?? '—'}
            </span>
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
                <div className="mypage-profile-name">
                    {stats ? `${stats.title} ${stats.username}` : '読み込み中…'}
                </div>
                <div className="mypage-profile-stats">
                    <span className="mypage-stat">累計プレイ回数：{stats?.total_plays ?? '—'}回</span>
                    {stats && (
                        <span className="mypage-stat-highlight">最高得点：{stats.best_score}点</span>
                    )}
                </div>
            </div>
            <img src={ramenImage} alt="" className="mypage-profile-ramen" />
        </div>

        {/* Main Content */}
        <div className="mypage-content">
            {/* Command Miss History */}
            <div className="mypage-panel mypage-panel--full">
                <div className="mypage-panel-header">コマンドミス履歴</div>
                <div className="mypage-panel-body">
                    {error && <p className="mypage-error">{error}</p>}
                    {!error && missedCommands.length === 0 && (
                        <p className="mypage-empty">ミス履歴がありません</p>
                    )}
                    {missedCommands.length > 0 && (() => {
                        const yMax = maxMiss + 1
                        const ticks = Array.from({ length: yMax + 1 }, (_, i) => i)
                        return (
                            <div className="mypage-chart-wrapper">
                                {/* Y axis labels */}
                                <div className="mypage-chart-yaxis">
                                    {ticks.reverse().map(v => (
                                        <span key={v} className="mypage-chart-ylabel">{v}</span>
                                    ))}
                                </div>
                                {/* Chart area */}
                                <div className="mypage-chart-area">
                                    {/* Grid lines */}
                                    <div className="mypage-chart-gridlines">
                                        {Array.from({ length: yMax + 1 }, (_, i) => (
                                            <div key={i} className="mypage-chart-gridline" />
                                        ))}
                                    </div>
                                    {/* Bars */}
                                    <div className="mypage-chart-bars">
                                        {missedCommands.map((c, i) => (
                                            <div key={i} className="mypage-chart-bar-col">
                                                <div className="mypage-chart-bar-track">
                                                    <div
                                                        className="mypage-chart-bar-fill"
                                                        style={{ height: `${(c.count / yMax) * 100}%` }}
                                                    />
                                                </div>
                                                <code className="mypage-chart-label">{c.cmd}</code>
                                            </div>
                                        ))}
                                    </div>
                                    {/* X axis line */}
                                    <div className="mypage-chart-xaxis" />
                                </div>
                            </div>
                        )
                    })()}
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
