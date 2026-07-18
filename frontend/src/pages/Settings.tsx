import '../css/Settings.css'
import { previewSound } from '../lib/Sounds'
import { DEFAULT_SOUND } from '../types/interface'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSoundSettings } from '../context/SoundContext'
import type { SoundSettings } from '../types/interface'

type PreviewKey = 'se' | 'type' | 'miss'
const previewKeys: PreviewKey[] = ['se', 'type', 'miss']

function Settings() {
    const navigate = useNavigate()
    const { soundSettings, setSoundSettings } = useSoundSettings()
    const [playingKey, setPlayingKey] = useState<string | null>(null)

    const handleVolume = (key: keyof SoundSettings, value: number) => {
        setSoundSettings({ ...soundSettings, [key]: value })
    }

    const handlePreview = (key: PreviewKey) => {
        previewSound(key, soundSettings[key])
        setPlayingKey(key)
        setTimeout(() => setPlayingKey(null), 400)
    }

    const items: { key: keyof SoundSettings; label: string }[] = [
        { key: 'bgm', label: 'BGM' },
        { key: 'se', label: '効果音' },
        { key: 'type', label: 'タイプ音' },
        { key: 'miss', label: 'ミス音' },
    ]

    const hasPreview = (key: keyof SoundSettings): key is PreviewKey =>
        previewKeys.includes(key as PreviewKey)

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h1 className="settings-title">設定</h1>
            </header>
            <div className="settings-body">
                <section className="settings-section">
                    <div className="settings-section-header">
                        <h2 className="settings-section-title">サウンド</h2>
                        <button
                            className="settings-reset-btn"
                            onClick={() => setSoundSettings(DEFAULT_SOUND)}
                        >
                            初期値に戻す
                        </button>
                    </div>
                    <div className="settings-list">
                        {items.map((item) => (
                            <div key={item.key} className="settings-row">
                                <span className="settings-label">{item.label}</span>
                                <div className="settings-controls">
                                    {hasPreview(item.key) && (
                                        <button
                                            className={`settings-preview-btn ${playingKey === item.key ? 'settings-preview-btn--playing' : ''}`}
                                            onClick={() => handlePreview(item.key as PreviewKey)}
                                            title="試聴"
                                        >
                                            ▶
                                        </button>
                                    )}
                                    <input
                                        type="range"
                                        className="settings-volume-slider"
                                        min={0}
                                        max={100}
                                        value={soundSettings[item.key]}
                                        onChange={(e) => handleVolume(item.key, Number(e.target.value))}
                                    />
                                    <span className="settings-volume-value">
                                        {soundSettings[item.key]}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            <div className="settings-footer">
                <button className="settings-back-btn" onClick={() => navigate(-1)}>
                    タイトルに戻る
                </button>
            </div>
        </div>
    )
}

export default Settings
