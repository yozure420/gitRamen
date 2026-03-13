import { useEffect } from 'react'
import './css/GmScreen.css'
import { useGmScreen } from './hooks/useGmScreen'
import GmLeftPanel from './components/gm/GmLeftPanel'
import GmCenterPanel from './components/gm/GmCenterPanel'
import GmRightPanel from './components/gm/GmRightPanel'
import GmBottomPanel from './components/gm/GmBottomPanel'
import type { SoundSettings } from './Settings'
import { startGameBgm, stopGameBgm } from './Sounds'

type GmScreenProps = {
  soundSettings: SoundSettings
}

function GmScreen({ soundSettings }: GmScreenProps) {
  const {
    inputCommand,
    setInputCommand,
    ramens,
    score,
    course,
    message,
    showHelp,
    commandHistory,
    showLog,
    orderLogs,
    isCompactLog,
    isPaused,
    timeRemaining,
    isGameOver,
    isLoading,
    handleSubmit,
    getLaneRamens,
    activeRamen,
    availableItems,
    courseCommands,
    laneCount,
    resumeGame,
  } = useGmScreen({ soundSettings })

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
      <GmLeftPanel
        score={score}
        timeRemaining={timeRemaining}
        course={course}
        laneCount={laneCount}
        courseCommands={courseCommands}
        ramens={ramens}
        activeRamen={activeRamen}
        showHelp={showHelp}
        showLog={showLog}
        commandHistory={commandHistory}
        orderLogs={orderLogs}
        isCompactLog={isCompactLog}
        isPaused={isPaused}
        resumeGame={resumeGame}
      />

      <GmCenterPanel
        activeRamen={activeRamen}
        getLaneRamens={getLaneRamens}
        laneCount={laneCount}
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
