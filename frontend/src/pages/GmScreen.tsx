import { useEffect } from 'react'
import '../css/GmScreen.css'
import { useGmScreen } from '../hooks/useGmScreen'
import { GmTopPanelV2, GmLanePanelV2, GmOrderPanelV2, GmBottomPanelV2 } from '../components/gmV2';
import { ResumePanels } from '../components/ResumePanels'
import type { SoundSettings } from '../types/interface'
import { startGameBgm, stopGameBgm } from '../lib/Sounds'

type GmScreenProps = {
  soundSettings: SoundSettings
  initialCourse: number
  onGoToMyPage: () => void
  onGoToTitle: () => void
}

// 👇 追加: 本物のGit(SHA-1)っぽいリアルなハッシュ値をIDから生成する関数
const getCommitHash = (id: number, isShort: boolean) => {
  const salts = [
    '3f786850e387550fdab836ed7e6dc881de23001b',
    '89d3b874457e841285265538e4a90586234b6b71',
    'a45c2069b2d39587445580665123984532c25609',
    'f872c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    'c3452b1109a897b65432c2123d4567e890a1b2c3'
  ];
  const base = salts[id % salts.length];
  const idHex = id.toString(16).padStart(4, '0');
  const full = idHex + base.substring(4);
  return isShort ? full.substring(0, 7) : full;
};

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
    commandHistory,
    statusWindow,
    showLog,
    closeLog,
    orderLogs,
    isCompactLog,
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

  const isUiLayerOpen = !!statusWindow || showLog;

  return (
    <>
    <button
      className="title-back-btn"
      onClick={onGoToTitle}
    >
      タイトルへ戻る
    </button>
    <ResumePanels />

    {/* 📊 伝票モーダル (git status) */}
    {statusWindow && (
      <div className="game-modal-backdrop">
        <div className="status-slip-box-v2">
          <div className="slip-clip"></div>
          <h3 className="status-slip-title-v2">{statusWindow.title}</h3>
          <div className="slip-dashed-line"></div>
          <p className="status-slip-phase-v2">{statusWindow.phaseMessage}</p>
          <div className="status-slip-details-v2">
            {statusWindow.details.map((detail, idx) => (
              <p key={idx} className="status-slip-item-v2">・ {detail}</p>
            ))}
          </div>
          <div className="slip-dashed-line" style={{ marginTop: '20px' }}></div>
          <p className="slip-footer-hint">【 Enter 】または【 Esc 】キーで厨房に戻る</p>
        </div>
      </div>
    )}

    {/* 🧾 レシートモーダル (git log / --oneline) */}
    {showLog && (
      <div className="game-modal-backdrop" onClick={closeLog}>
        <div className="log-receipt-box-v2" onClick={(e) => e.stopPropagation()}>
          <div className="log-receipt-header-v2">
            <h2 className="log-receipt-title-v2">
              {isCompactLog ? "git log --oneline" : "git log"}
            </h2>
            <button className="log-receipt-close-v2" onClick={closeLog}>✕</button>
          </div>
          <div className="log-receipt-divider-v2"></div>
          
          <div className="log-receipt-body-v2">
            <div className="log-receipt-subtitle-v2">RAMEN GIT KITCHEN / ORDER HISTORY RECEIPT</div>
            
            {orderLogs.length === 0 ? (
              <p className="log-receipt-empty-v2">履歴はまだありません</p>
            ) : (
              <div className="log-receipt-list-v2">
                {/* 👇 修正: 配列をリバースして最新を上に。そして gameNote (コミットメッセージ) を表示！ */}
                {[...orderLogs].reverse().map((log, idx) => (
                  <div key={idx} className="log-receipt-item-v2">
                    {isCompactLog ? (
                      <div className="log-receipt-oneline-v2">
                        <span className="log-hash-v2">{getCommitHash(log.ramenId, true)}</span>
                        {/* エラーメッセージではなく、実際のコミットメッセージ（コール）を表示 */}
                        <span className="log-msg-v2">{log.gameNote || log.summary}</span>
                      </div>
                    ) : (
                      <div className="log-receipt-full-v2">
                        <div className="log-hash-full-v2">commit {getCommitHash(log.ramenId, false)}</div>
                        <div className="log-date-v2">Date:   {new Date(log.timestamp).toString().replace(/GMT.*/, '')}</div>
                        <div className="log-msg-full-v2">
                          <p className="log-msg-summary-v2">    {log.gameNote || log.summary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="log-receipt-divider-v2" style={{ marginBottom: '10px' }}></div>
          <p className="receipt-footer-hint">【 Enter 】または【 Esc 】キーで厨房に戻る</p>
        </div>
      </div>
    )}

    <div className={`game-container-v2 ${isUiLayerOpen ? 'game-container-v2--paused' : ''}`}>
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

      <GmTopPanelV2 score={score} timeLeft={timeRemaining} ramen={activeRamen} />
      <GmLanePanelV2 ramen={activeRamen} existingBrancheNames={existingBranches} />
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
        commandHistory={commandHistory}
      />
    </div>
    </>
  )
}

export default GmScreen