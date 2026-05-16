import { useEffect } from 'react'
import '../css/GmScreen.css'
import { useGmScreen } from '../hooks/useGmScreen'
import { GmTopPanelV2, GmLanePanelV2, GmOrderPanelV2, GmBottomPanelV2 } from '../components/gmV2';
import type { SoundSettings } from '../types/interface'
import { startGameBgm, stopGameBgm } from '../lib/Sounds'

type GmScreenProps = {
  soundSettings: SoundSettings
  initialCourse: number
  onGoToMyPage: () => void
  onGoToTitle: () => void
}

function GmScreen({ soundSettings, initialCourse, onGoToMyPage, onGoToTitle }: GmScreenProps) {
  const {
    score,
    timeRemaining,
    isGameOver,
    isLoading,
    handleSubmit,
    activeRamen,
    existingBranches,
    retryGame,
    showHelp,
    courseCommands,
    isPaused,
    resumeGame,
    commandHistory, // 👇 修正: 履歴データを取り出す
  } = useGmScreen({ soundSettings, initialCourse })

  useEffect(() => {
    if (soundSettings.bgm) {
      startGameBgm(soundSettings)
    } else {
      stopGameBgm()
    }

    return () => {
      stopGameBgm()
    }
  }, [soundSettings])

  return (
    <>
    <button
      className="title-back-btn"
      onClick={onGoToTitle}
    >
      タイトルへ戻る
    </button>
    <div className="game-container-v2">
      {isGameOver && (
        <div className="gameover-overlay">
          <div className="gameover-box">
            <h2 className="gameover-title">ゲーム終了</h2>
            <p className="gameover-score">{score}<span className="gameover-score-unit">点</span></p>
            <div className="gameover-buttons">
              <button className="gameover-btn gameover-btn--retry" onClick={retryGame}>もう一度プレイ</button>
              <button className="gameover-btn gameover-btn--mypage" onClick={onGoToMyPage}>マイページへ</button>
            </div>
          </div>
        </div>
      )}
      <GmTopPanelV2
        score={score}
        timeLeft={timeRemaining}
        ramen={activeRamen}
      />
      <GmLanePanelV2
        ramen={activeRamen}
        existingBrancheNames={existingBranches}
      />
      <GmOrderPanelV2
        ramen={activeRamen}
        lanes={existingBranches}
        showHelp={showHelp}
        courseCommands={courseCommands}
        isPaused={isPaused}
        resumeGame={resumeGame}
        onGoToTitle={onGoToTitle}
      />
      <GmBottomPanelV2
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        isGameOver={isGameOver}
        soundSettings={soundSettings}
        commandHistory={commandHistory} // 
      />
    </div>
    </>
  )
}

export default GmScreen