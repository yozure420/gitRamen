import './Settings.css'
import { previewSound } from './sounds'

export interface SoundSettings {
    bgm: boolean
    se: boolean
    type: boolean
    miss: boolean
}

interface SettingsProps {
    soundSettings: SoundSettings
    onChangeSoundSettings: (settings: SoundSettings) => void
    onBack: () => void
}

type PreviewKey = 'se' | 'type' | 'miss'
const previewKeys: PreviewKey[] = ['se', 'type', 'miss']

function Settings({ soundSettings, onChangeSoundSettings, onBack }: SettingsProps) {
    const toggle = (key: keyof SoundSettings) => {
    onChangeSoundSettings({ ...soundSettings, [key]: !soundSettings[key] })
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
                <h2 className="settings-section-title">サウンド</h2>
                <div className="settings-list">
                    {items.map((item) => (
                        <div key={item.key} className="settings-row">
                            <span className="settings-label">{item.label}</span>
                            <div className="settings-controls">
                                {hasPreview(item.key) && (
                                <button
                                className="settings-preview-btn"
                                onClick={() => previewSound(item.key)}
                                title="試聴"
                                >
                                    ▶
                                </button>
                                )}
                                <button
                                className={`settings-toggle ${soundSettings[item.key] ? 'on' : 'off'}`}
                                onClick={() => toggle(item.key)}
                                >
                                    <span className="settings-toggle-knob" />
                                    <span className="settings-toggle-text">
                                        {soundSettings[item.key] ? 'ON' : 'OFF'}
                                    </span>
                                </button>
                            </div>
                        </div>
            ))}
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
