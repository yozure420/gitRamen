import './css/GmScreen.css'
import { useGmScreen } from './hooks/useGmScreen'
import GmLeftPanel from './components/gm/GmLeftPanel'
import GmCenterPanel from './components/gm/GmCenterPanel'
import GmRightPanel from './components/gm/GmRightPanel'
import GmBottomPanel from './components/gm/GmBottomPanel'

function GmScreen() {
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
    handleLevelChange,
    getLaneRamens,
    activeRamen,
    availableItems,
    laneCount,
    resumeGame,
  } = useGmScreen()

  return (
    <div className="game-container">
      <GmLeftPanel
        score={score}
        timeRemaining={timeRemaining}
        course={course}
        ramens={ramens}
        activeRamen={activeRamen}
        showHelp={showHelp}
        showLog={showLog}
        commandHistory={commandHistory}
        orderLogs={orderLogs}
        isCompactLog={isCompactLog}
        isPaused={isPaused}
        resumeGame={resumeGame}
        isLoading={isLoading}
        handleLevelChange={handleLevelChange}
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
      />
    </div>
  )
}

export default GmScreen
