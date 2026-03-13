import './TitlePage.css'
import { useState } from 'react'

interface TitlePageProps {
    onStart: () => void
    onMyPage: () => void
    onHowToPlay: () => void
    onSettings: () => void
    onLogin: () => void
    onLogout: () => void
    onRegister: () => void
    isLoggedIn: boolean
}

function TitlePage({ onStart, onMyPage, onHowToPlay, onSettings, onLogin, onLogout, onRegister, isLoggedIn }: TitlePageProps) {
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
            <h1 className="title-heading">ぎっとぎとゲーム</h1>
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

        {/* Auth area */}
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
