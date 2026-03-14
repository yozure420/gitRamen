import { useEffect } from 'react'
import '../css/GmScreen.css'
import { useGmScreen } from '../hooks/useGmScreen'
import GmLeftPanel from '../components/gm/GmLeftPanel'
import GmCenterPanel from '../components/gm/GmCenterPanel'
import GmRightPanel from '../components/gm/GmRightPanel'
import GmBottomPanel from '../components/gm/GmBottomPanel'
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
    inputCommand,
    setInputCommand,
    ramens,
    score,
    course,
    message,
    showHelp,
    showLog,
    orderLogs,
    isCompactLog,
    isPaused,
    customerAlert,
    statusWindow,
    closeLog,
    timeRemaining,
    isGameOver,
    isLoading,
    handleSubmit,
    getLaneRamens,
    activeRamen,
    availableItems,
    courseCommands,
    laneCount,
    existingBranches,
    resumeGame,
    retryGame,
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
    <div className="game-container">
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
      <GmLeftPanel
        score={score}
        timeRemaining={timeRemaining}
        course={course}
        laneCount={laneCount}
        existingBranches={existingBranches}
        courseCommands={courseCommands}
        ramens={ramens}
        activeRamen={activeRamen}
        showHelp={showHelp}
        isPaused={isPaused}
        resumeGame={resumeGame}
        onGoToTitle={onGoToTitle}
      />

      <GmCenterPanel
        activeRamen={activeRamen}
        getLaneRamens={getLaneRamens}
        laneCount={laneCount}
        existingBranches={existingBranches}
        customerAlert={customerAlert}
        statusWindow={statusWindow}
        showLog={showLog}
        isCompactLog={isCompactLog}
        orderLogs={orderLogs}
        closeLog={closeLog}
      />

      <GmRightPanel
        availableItems={availableItems}
        activeRamen={activeRamen}
      />

      <GmBottomPanel
        message={message}
        activeRamen={activeRamen}
        handleSubmit={handleSubmit}
        inputCommand={inputCommand}
        setInputCommand={setInputCommand}
        isLoading={isLoading}
        isGameOver={isGameOver}
        soundSettings={soundSettings}
      />
    </div>
  )
}

export default GmScreen