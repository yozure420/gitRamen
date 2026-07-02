import '../css/TitlePage.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, removeToken } from '../api/auth'

function TitlePage() {
    const navigate = useNavigate()
    const [isLoggedIn, setIsLoggedIn] = useState(() => getToken() !== null)
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)

    const menuItems = [
        { key: 'start', label: 'スタート', action: () => navigate('/start') },
        { key: 'howto', label: '遊び方', action: () => navigate('/howto') },
        { key: 'settings', label: '設定', action: () => navigate('/settings') },
    ]

    const handleLogout = () => {
        removeToken()
        setIsLoggedIn(false)
    }

    return (
    <div className="title-container">
        <div className="title-bg-texture" />
        <div className="title-bg-gradient" />
        <div className="title-heading-wrapper">
            <h1 className="title-heading">ぎっとぎとラーメン</h1>
        </div>

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

        <div className="title-auth">
            {isLoggedIn ? (
                <>
                    <button className="title-auth-link" onClick={() => navigate('/mypage')}>マイページ</button>
                    <button className="title-auth-link" onClick={handleLogout}>ログアウト</button>
                </>
            ) : (
                <>
                    <button className="title-auth-link" onClick={() => navigate('/login')}>ログイン</button>
                    <button className="title-auth-link" onClick={() => navigate('/register')}>新規登録</button>
                </>
            )}
        </div>
    </div>
)
}

export default TitlePage
