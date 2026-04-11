import type { Ramen } from '../../types/interface'

type GmTopPanelV2Props = {
    score: number
    timeLeft: number
    ramen: Ramen | null
}

function GmTopPanelV2({score, timeLeft, ramen}: GmTopPanelV2Props){
    return (
        <div className="top-panel">
            <div className="timeLeft">閉店: <span>{timeLeft}</span></div>
            {ramen && (
                <div className="ramen-progress">
                    配達: <span>{Math.floor(ramen.position)}%</span>
                </div>
            )}
            <div className="score">売上: <span>{score}</span></div>
        </div>
    )
}

export default GmTopPanelV2