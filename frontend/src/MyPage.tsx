import './MyPage.css'
import { useState } from 'react'

interface UserData {
    username: string
    title: string
    totalPlays: number
    accuracy: number
    lastPlay: string
    rate: number
    wins: number
    losses: number
}

interface MissedCommand {
    cmd: string
    count: number
}

interface BattleRecord {
    date: string
    result: '勝利' | '敗北'
    rateChange: string
}

interface MyPageProps {
    onCourseSelect: () => void
    onBackToTitle: () => void
}

function MyPage({ onCourseSelect, onBackToTitle }: MyPageProps) {
    const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  // TODO: APIから取得する
    const userData: UserData = {
    username: 'タナカ',
    title: 'Git見習い',
    totalPlays: 12,
    accuracy: 93,
    lastPlay: '2026/03/03',
    rate: 1000,
    wins: 10,
    losses: 2,
}

    const missedCommands: MissedCommand[] = [
    { cmd: 'reset', count: 5 },
    { cmd: 'commit', count: 3 },
    { cmd: 'checkout', count: 2 },
    { cmd: 'pull', count: 1 },
    { cmd: 'revert', count: 1 },
]

    const battleHistory: BattleRecord[] = [
    { date: '2026/03/03', result: '勝利', rateChange: '+25' },
    { date: '2026/03/01', result: '勝利', rateChange: '+18' },
    { date: '2026/02/28', result: '敗北', rateChange: '-12' },
    { date: '2026/02/25', result: '勝利', rateChange: '+22' },
]

    const maxMiss = Math.max(...missedCommands.map(c => c.count))

    return (
    <div className="mypage-container">
        {/* Header */}
        <header className="mypage-header">
            <h1 className="mypage-title">マイページ</h1>
            <span className="mypage-last-play">最終プレイ：{userData.lastPlay}</span>
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
            <div className="mypage-profile-name">{userData.title} {userData.username}</div>
            <div className="mypage-profile-stats">
                <span className="mypage-stat">累計プレイ回数：{userData.totalPlays}回</span>
                <span className="mypage-stat-highlight">正解率：{userData.accuracy}%</span>
            </div>
        </div>
        <img src="/images/ramen.png" alt="" className="mypage-profile-ramen" />
    </div>

    {/* Main Content */}
      <div className="mypage-content">
        {/* Command Miss History */}
        <div className="mypage-panel">
          <div className="mypage-panel-header">コマンドミス履歴</div>
          <div className="mypage-panel-body">
            {(() => {
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

        {/* Battle History */}
            <div className="mypage-panel">
                <div className="mypage-panel-header">対戦履歴</div>
                <div className="mypage-panel-body">
                    <div className="mypage-battle-summary">
                        <span className="mypage-rate">レート {userData.rate}</span>
                        <span className="mypage-wl">勝利：{userData.wins}　敗北：{userData.losses}</span>
                    </div>
                    <div className="mypage-battle-table">
                        <div className="mypage-battle-th">日付</div>
                        <div className="mypage-battle-th center">結果</div>
                        <div className="mypage-battle-th right">レート変動</div>
                        {battleHistory.map((h, i) => (
                        <div key={i} className="mypage-battle-row">
                            <div className="mypage-battle-td">{h.date}</div>
                            <div className={`mypage-battle-td center ${h.result === '勝利' ? 'win' : 'lose'}`}>
                                {h.result}
                            </div>
                            <div className={`mypage-battle-td right ${h.rateChange.startsWith('+') ? 'win' : 'lose'}`}>
                                {h.rateChange}
                            </div>
                        </div>
                        ))}
                    </div>
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
