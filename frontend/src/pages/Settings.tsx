import '../css/Settings.css'
import { previewSound } from '../lib/Sounds'
import type { SoundSettings } from '../types/interface'
import { useState } from 'react'
import { DEFAULT_SOUND } from '../types/interface'

type SettingsProps = {
    soundSettings: SoundSettings
    onChangeSoundSettings: (settings: SoundSettings) => void
    onBack: () => void
}

type PreviewKey = 'se' | 'type' | 'miss'
const previewKeys: PreviewKey[] = ['se', 'type', 'miss']

function Settings({ soundSettings, onChangeSoundSettings, onBack }: SettingsProps) {
    const [playingKey, setPlayingKey] = useState<string | null>(null)

    const handleVolume = (key: keyof SoundSettings, value: number) => {
        onChangeSoundSettings({ ...soundSettings, [key]: value })
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
                            onClick={() => onChangeSoundSettings(DEFAULT_SOUND)}
                        >
                            初期値に戻す
                        </button>
                    </div>
                    <div className="settings-list">
                        {items.map((item) => {
                            const key = item.key
                            return (
                            <div key={key} className="settings-row">
                                <span className="settings-label">{item.label}</span>
                                <div className="settings-controls">
                                    {hasPreview(key) && (
                                        <button
                                            className={`settings-preview-btn ${playingKey === key ? 'settings-preview-btn--playing' : ''}`}
                                            onClick={() => handlePreview(key)}
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
                                        value={soundSettings[key]}
                                        onChange={(e) => handleVolume(key, Number(e.target.value))}
                                    />
                                    <span className="settings-volume-value">
                                        {soundSettings[key]}
                                    </span>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                </section>
            </div>
            <div className="settings-footer">
                <button className="settings-back-btn" onClick={onBack}>
                    タイトルに戻る
                </button>
            </div>
        </div>
    )
}

export default Settings
