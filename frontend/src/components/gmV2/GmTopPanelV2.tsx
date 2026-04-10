import type { Ramen } from '../../types/interface'

type GmTopPanelV2Props = {
    score: number
    timeLeft: number
    isPaused: boolean
    resumeGame: () => void
    onGoToTitle: () => void
    ramen: Ramen | null
}

function GmTopPanelV2({score, timeLeft, isPaused, resumeGame, onGoToTitle, ramen}: GmTopPanelV2Props){
    return (
        <div className="top-panel">
            <div className="timeLeft">閉店: <span>{timeLeft}</span></div>
            <div className="score">売上: <span>{score}</span></div>
            {ramen && (
                <div className="ramen-progress">
                    配達: <span>{Math.floor(ramen.position)}%</span>
                </div>
            )}
            {isPaused && (
                <div className="top-panel-pause-btns">
                    <button className="top-panel-pause-btn" onClick={resumeGame}>▶ 再開</button>
                    <button className="top-panel-pause-btn" onClick={onGoToTitle}>タイトルへ戻る</button>
                </div>
            )}
        </div>
    )
}

export default GmTopPanelV2