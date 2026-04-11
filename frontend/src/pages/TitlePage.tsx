import '../css/TitlePage.css'
import { useState } from 'react'

interface TitlePageProps {
    isLoggedIn: boolean
    onStart: () => void
    onMyPage: () => void
    onHowToPlay: () => void
    onSettings: () => void
    onLogin: () => void
    onRegister: () => void
    onLogout: () => void
}

function TitlePage({ isLoggedIn, onStart, onMyPage, onHowToPlay, onSettings, onLogin, onRegister, onLogout}: TitlePageProps) {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)
    const menuItems = [
    { key: 'start', label: 'スタート', action: onStart },
    { key: 'howto', label: '遊び方', action: onHowToPlay },
    { key: 'settings', label: '設定', action: onSettings },
]

    return (
    <div className="title-container">
        <div className="title-bg-texture" />
        <div className="title-bg-gradient" />
        {/* Title */}
        <div className="title-heading-wrapper">
            <h1 className="title-heading">ぎっとぎとラーメン</h1> {/* タイトルを”ゲーム”⇒”ラーメン”に変更 */}
        </div>

        {/* Menu */}
        <nav className="title-menu">
        {menuItems.map((item) => (
            <button
            key={item.key}
            className={`title-menu-item ${hoveredItem === item.key ? 'active' : ''}`}
            onClick={item.action}
            onMouseEnter={() => setHoveredItem(item.key)}
            onMouseLeave={() => setHoveredItem(null)}
            >
            {item.label}
            </button>
        ))}
        </nav>

        {/* Login / Register / MyPage */}
        <div className="title-auth">
            {isLoggedIn ? (
                <>
                    <button className="title-auth-link" onClick={onMyPage}>マイページ</button>
                    <button className="title-auth-link" onClick={onLogout}>ログアウト</button>
                </>
            ) : (
                <>
                    <button className="title-auth-link" onClick={onLogin}>ログイン</button>
                    <button className="title-auth-link" onClick={onRegister}>新規登録</button>
                </>
            )}
        </div>
    </div>
)
}

export default TitlePage
