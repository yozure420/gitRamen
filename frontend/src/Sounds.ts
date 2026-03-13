import type { SoundSettings } from './Settings'

const sounds = {
    type: new Audio('/sounds/決定ボタンを押す38.mp3'),
    miss: new Audio('/sounds/ビープ音4.mp3'),
    se: new Audio('/sounds/クイズ正解2.mp3'),
}

// Dedicated BGM source (add file under public/sounds/game-bgm.mp3 when available)
const bgm = new Audio('/sounds/game-bgm.mp3')
bgm.loop = true
bgm.volume = 0.25

// 設定に応じて再生
export function playSound(key: 'type' | 'miss' | 'se', settings: SoundSettings) {
    if (!settings[key]) return
    const audio = sounds[key]
    audio.currentTime = 0
    audio.play().catch(() => {})
}

// 設定無視で再生（試聴用）
export function previewSound(key: 'type' | 'miss' | 'se') {
    const audio = sounds[key]
    audio.currentTime = 0
    audio.play().catch(() => {})
}

export function startGameBgm(settings: SoundSettings) {
    if (!settings.bgm) return
    bgm.play().catch(() => {})
}

export function stopGameBgm() {
    bgm.pause()
    bgm.currentTime = 0
}
