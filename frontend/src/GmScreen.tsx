import './GmScreen.css'
import { useState, useEffect, useRef } from 'react'

interface Command {
  id: number
  command: string
  description: string
  course: number
}

interface Ramen {
  id: number
  command: Command
  currentLane: number
  targetLane: number
  position: number // 0-100
  isCompleted: boolean
  stagedItems: string[] // 追加: git addで追加した具材
  isCommitted: boolean // 追加: git commitしたか
}

interface CommandHistory {
  command: string
  timestamp: Date
}

const API_BASE_URL = 'http://localhost:8000'
const GAME_TIME_LIMIT = 60 // 60秒
const RAMEN_SPEED = 0.2 // 1フレームで進む量
const SPAWN_CHECK_INTERVAL = 500 // 0.5秒ごとにチェック
const MAX_RAMENS = 2 // 画面上の最大ラーメン数
const MIN_SPAWN_DELAY = 1500 // 最低1.5秒間隔で生成
const MIN_POSITION_GAP = 10 // 10%進んだら次を生成可能
const AVAILABLE_ITEMS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン']

function GmScreen() {
  const [inputCommand, setInputCommand] = useState('')
  const [ramens, setRamens] = useState<Ramen[]>([])
  const [score, setScore] = useState(0)
  const [course, setCourse] = useState(1)
  const [message, setMessage] = useState('git help でヒントを表示')
  const [showHelp, setShowHelp] = useState(false)
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([])
  const [showLog, setShowLog] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(GAME_TIME_LIMIT)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [availableCommands, setAvailableCommands] = useState<Command[]>([])
  const [nextRamenId, setNextRamenId] = useState(1)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpawnTimeRef = useRef<number>(0)

  // ゲーム開始
  useEffect(() => {
    startGame()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    }
  }, [course])

  const startGame = async () => {
    setIsLoading(true)
    setTimeRemaining(GAME_TIME_LIMIT)
    setIsGameOver(false)
    setRamens([])
    setNextRamenId(1)
    lastSpawnTimeRef.current = 0
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/commands/random?course=${course}&count=20`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const commands: Command[] = await response.json()
      
      if (!commands || commands.length === 0) {
        setMessage('❌ コマンドが取得できませんでした')
        return
      }
      
      setAvailableCommands(commands)
      setMessage(`🎮 コース ${course} スタート！git clone URL で注文、git add で具材追加！`)
      
      // 最初のラーメンを生成
      setTimeout(() => spawnRamen(commands), 500)
    } catch (error) {
      console.error('Failed to load commands:', error)
      setMessage(`❌ サーバーに接続できません`)
    } finally {
      setIsLoading(false)
    }
  }

  const spawnRamen = (commands: Command[]) => {
    if (commands.length === 0) return
    
    const now = Date.now()
    const timeSinceLastSpawn = now - lastSpawnTimeRef.current
    
    if (lastSpawnTimeRef.current !== 0 && timeSinceLastSpawn < MIN_SPAWN_DELAY) {
      return
    }
    
    let shouldSpawn = false
    
    setRamens(prev => {
      const activeRamens = prev.filter(r => !r.isCompleted)
      if (activeRamens.length >= MAX_RAMENS) {
        return prev
      }
      
      if (activeRamens.length > 0) {
        const minPosition = Math.min(...activeRamens.map(r => r.position))
        if (minPosition < MIN_POSITION_GAP) {
          return prev
        }
      }
      
      shouldSpawn = true
      
      const randomCommand = commands[Math.floor(Math.random() * commands.length)]
      const startLane = Math.floor(Math.random() * 3) + 1
      const targetLane = Math.floor(Math.random() * 3) + 1
      
      const newRamen: Ramen = {
        id: nextRamenId,
        command: randomCommand,
        currentLane: startLane,
        targetLane: targetLane,
        position: 0,
        isCompleted: false,
        stagedItems: [],
        isCommitted: false
      }
      
      setMessage(`🍜 新しいラーメン #${nextRamenId}！Lane ${startLane} → Lane ${targetLane} へ`)
      return [...prev, newRamen]
    })
    
    if (shouldSpawn) {
      lastSpawnTimeRef.current = now
      setNextRamenId(prev => prev + 1)
    }
  }

  // タイマー
  useEffect(() => {
    if (isLoading || isGameOver) return

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          gameOver()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLoading, isGameOver])

  // ラーメンの滑らかな移動
  useEffect(() => {
    if (isLoading || isGameOver) return

    moveIntervalRef.current = setInterval(() => {
      setRamens(prev => {
        return prev.map(ramen => {
          if (ramen.isCompleted) return ramen
          
          const newPosition = Math.min(100, ramen.position + RAMEN_SPEED)
          
          if (newPosition >= 100) {
            if (ramen.currentLane === ramen.targetLane) {
              setScore(s => s + 100 * course)
              setMessage(`✅ 正解！Lane ${ramen.targetLane} のお客さんに届きました！ +${100 * course}点`)
            } else {
              setScore(s => Math.max(0, s - 50))
              setMessage(`❌ 間違い！Lane ${ramen.targetLane} に届けるべきでした (-50点)`)
            }
            setTimeout(() => {
              setRamens(p => p.filter(r => r.id !== ramen.id))
              setTimeout(() => {
                if (availableCommands.length > 0) {
                  spawnRamen(availableCommands)
                }
              }, 500)
            }, 1000)
            return { ...ramen, position: 100, isCompleted: true }
          }
          
          return { ...ramen, position: newPosition }
        })
      })
    }, 50)

    return () => {
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)
    }
  }, [isLoading, isGameOver, course, availableCommands])

  // 定期的に新しいラーメンを生成
  useEffect(() => {
    if (isLoading || isGameOver || availableCommands.length === 0) return

    spawnIntervalRef.current = setInterval(() => {
      spawnRamen(availableCommands)
    }, SPAWN_CHECK_INTERVAL)

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    }
  }, [isLoading, isGameOver, availableCommands, nextRamenId, ramens])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputCommand.trim() || isGameOver) return

    const cmd = inputCommand.trim()
    setCommandHistory(prev => [...prev, { command: cmd, timestamp: new Date() }])

    // git clone URL - 注文開始（表示のみ）
    if (cmd.match(/^git clone .+$/i)) {
      setMessage('📝 注文を開始します！ラーメンが流れてくるのを待ってください')
      setInputCommand('')
      return
    }

    // git add 具材 - アクティブなラーメンに具材追加
    const addMatch = cmd.match(/^git add (.+)$/i)
    if (addMatch) {
      const activeRamen = getActiveRamen()
      if (!activeRamen) {
        setMessage('❌ 操作できるラーメンがありません')
        setInputCommand('')
        return
      }
      
      const item = addMatch[1].trim()
      if (item === '.') {
        // 全部追加
        setRamens(prev => prev.map(r => 
          r.id === activeRamen.id ? { ...r, stagedItems: [...AVAILABLE_ITEMS] } : r
        ))
        setMessage(`✅ 全部のせ追加！`)
      } else if (AVAILABLE_ITEMS.includes(item)) {
        setRamens(prev => prev.map(r => {
          if (r.id === activeRamen.id) {
            if (r.stagedItems.includes(item)) {
              setMessage(`⚠️ ${item}は既に追加されています`)
              return r
            }
            setMessage(`✅ ${item}を追加しました`)
            return { ...r, stagedItems: [...r.stagedItems, item] }
          }
          return r
        }))
      } else {
        setMessage(`❌ ${item}という具材はありません`)
      }
      setInputCommand('')
      return
    }

    // git commit
    const commitMatch = cmd.match(/^git commit -m "(.+)"$/i)
    if (commitMatch) {
      const activeRamen = getActiveRamen()
      if (!activeRamen) {
        setMessage('❌ 操作できるラーメンがありません')
        setInputCommand('')
        return
      }
      
      setRamens(prev => prev.map(r => 
        r.id === activeRamen.id ? { ...r, isCommitted: true } : r
      ))
      setMessage(`🍜 へい、おまち！`)
      setInputCommand('')
      return
    }

    // git switch でラーメン移動
    const switchMatch = cmd.match(/^git (switch|checkout) lane([1-3])$/i)
    if (switchMatch) {
      const targetLane = parseInt(switchMatch[2])
      
      const activeRamen = getActiveRamen()
      if (activeRamen) {
        setRamens(prev => prev.map(r => 
          r.id === activeRamen.id ? { ...r, currentLane: targetLane } : r
        ))
        setMessage(`🔀 ラーメン #${activeRamen.id} を Lane ${targetLane} に移動`)
      } else {
        setMessage('❌ 移動できるラーメンがありません')
      }
      setInputCommand('')
      return
    }

    // git help
    if (cmd.match(/^git help$/i)) {
      setShowHelp(!showHelp)
      setMessage(showHelp ? 'ヒントを非表示' : '💡 ヒントを表示')
      setInputCommand('')
      return
    }

    // git log
    if (cmd.match(/^git log$/i)) {
      setShowLog(!showLog)
      setMessage(showLog ? '履歴を非表示' : '📜 コマンド履歴を表示')
      setInputCommand('')
      return
    }

    // git status
    if (cmd.match(/^git status$/i)) {
      const activeRamen = getActiveRamen()
      if (!activeRamen) {
        setMessage('📊 お腹すいた～')
      } else {
        setMessage(`📊 ⭐#${activeRamen.id}: 「${activeRamen.command.command}」 Lane${activeRamen.currentLane}→${activeRamen.targetLane} ${Math.floor(activeRamen.position)}% | 具材: ${activeRamen.stagedItems.join(', ') || 'なし'}`)
      }
      setInputCommand('')
      return
    }

    // データベースのコマンドをチェック
    const activeRamen = getActiveRamen()
    if (activeRamen) {
      if (activeRamen.command.command.toLowerCase() === cmd.toLowerCase()) {
        setMessage(`✅ 正解！「${cmd}」を実行しました！`)
        setScore(s => s + 50 * course)
        
        setRamens(prev => prev.map(r => {
          if (r.id === activeRamen.id) {
            if (r.currentLane === r.targetLane) {
              setScore(s => s + 100 * course)
              setMessage(`🎉 完璧！コマンド実行と配達成功！ +${150 * course}点`)
            } else {
              setMessage(`⚠️ コマンドは正解だけど、配達先が違います！Lane ${r.targetLane}に届けてください`)
            }
            setTimeout(() => {
              setRamens(p => p.filter(ramen => ramen.id !== r.id))
              spawnRamen(availableCommands)
            }, 1500)
            return { ...r, position: 100, isCompleted: true }
          }
          return r
        }))
        setInputCommand('')
        return
      }
    }
    
    const matchingCmd = availableCommands.find(
      c => c.command.toLowerCase() === cmd.toLowerCase()
    )
    
    if (matchingCmd) {
      setMessage(`❌ そのコマンドは今じゃない！現在のラーメンのコマンドを入力してください`)
    } else {
      setMessage(`❓ 不明なコマンド: ${cmd}`)
    }

    setInputCommand('')
  }

  const gameOver = () => {
    setIsGameOver(true)
    if (timerRef.current) clearInterval(timerRef.current)
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current)
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current)
    
    setMessage(`⏰ タイムアップ！最終スコア: ${score}点`)
    
    setTimeout(() => {
      const retry = window.confirm(`スコア: ${score}点\nもう一度プレイしますか？`)
      if (retry) {
        setScore(0)
        setCommandHistory([])
        startGame()
      }
    }, 1000)
  }

  const handleLevelChange = (newCourse: number) => {
    if (isLoading) return
    setCourse(newCourse)
    setScore(0)
    setCommandHistory([])
  }

  const getLaneRamens = (lane: number) => {
    return ramens.filter(r => r.currentLane === lane && !r.isCompleted)
  }

  const getActiveRamen = () => {
    const activeRamens = ramens.filter(r => !r.isCompleted)
    if (activeRamens.length === 0) return null
    return activeRamens.reduce((prev, curr) => 
      prev.position > curr.position ? prev : curr
    )
  }

  return (
    <div className="game-container">
      {/* 左パネル */}
      <div className="left-panel">
        <h2 className="panel-title">🎯 ラーメン配達</h2>
        
        <div style={{ marginBottom: '20px', padding: '10px', background: '#2a2a2a', borderRadius: '8px' }}>
          <div style={{ fontSize: '18px', marginBottom: '5px' }}>
            スコア: <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{score}</span>
          </div>
          <div style={{ fontSize: '18px', marginBottom: '5px' }}>
            ⏱️ 残り時間: <span style={{ color: timeRemaining < 20 ? '#f44336' : '#4CAF50', fontWeight: 'bold' }}>{timeRemaining}s</span>
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            コース: {course === 1 ? '🟢 初級' : course === 2 ? '🔵 中級' : course === 3 ? '🟠 上級' : '💀 誰が使うねん級'}
          </div>
        </div>

        {/* 現在のラーメン */}
        <div className="command-list">
          <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#888' }}>現在のラーメン:</h3>
          {ramens.filter(r => !r.isCompleted).map(ramen => {
            const activeRamen = getActiveRamen()
            const isActive = activeRamen?.id === ramen.id
            return (
              <div 
                key={ramen.id} 
                className="command-item" 
                style={{ 
                  marginBottom: '8px',
                  background: isActive ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : '#2a2a2a',
                  border: isActive ? '2px solid #FFD700' : '1px solid #444',
                  boxShadow: isActive ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="lane-label" style={{ color: isActive ? '#000' : '#fff' }}>
                  {isActive && '⭐ '}ラーメン #{ramen.id}{isActive && ' (操作中)'}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: isActive ? '#000' : '#00FF00',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(0,255,0,0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginTop: '5px',
                  border: isActive ? '1px solid #000' : '1px solid #00FF00'
                }}>
                  📝 {ramen.command.command}
                </div>
                <div style={{ fontSize: '12px', color: isActive ? '#000' : '#FFA500', fontWeight: isActive ? 'bold' : 'normal', marginTop: '5px' }}>
                  Lane {ramen.currentLane} → Lane {ramen.targetLane}
                </div>
                {ramen.stagedItems.length > 0 && (
                  <div style={{ fontSize: '11px', color: isActive ? '#333' : '#4CAF50', marginTop: '3px' }}>
                    具材: {ramen.stagedItems.join(', ')}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: isActive ? '#333' : '#888', marginTop: '3px' }}>
                  進行: {Math.floor(ramen.position)}%
                </div>
              </div>
            )
          })}
          {ramens.filter(r => !r.isCompleted).length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
              ラーメンを待っています...
            </div>
          )}
        </div>

        {showHelp && (
          <div className="hint-section" style={{ marginTop: '15px' }}>
            <h3 className="hint-title">💡 遊び方</h3>
            <div className="hint-content" style={{ fontSize: '12px', lineHeight: '1.8' }}>
              <div>🍜 ラーメンが勝手に前進します（1個ずつ）</div>
              <div>📝 ⭐操作中のラーメンに表示されているコマンドを入力</div>
              <div>🔀 <code>git switch lane[1-3]</code> でレーン移動</div>
              <div>➕ <code>git add ネギ</code> で具材追加</div>
              <div>🌟 <code>git add .</code> で全部のせ</div>
              <div>🍜 <code>git commit -m "msg"</code> で完成</div>
              <div>🎯 正しいお客さん(Lane)に届けると高得点</div>
              <div>📊 <code>git status</code> で状態確認</div>
              <div>📜 <code>git log</code> で履歴表示</div>
            </div>
          </div>
        )}

        {showLog && (
          <div className="hint-section" style={{ marginTop: '15px', maxHeight: '200px', overflow: 'auto' }}>
            <h3 className="hint-title">📜 git log</h3>
            <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
              {commandHistory.slice().reverse().map((hist, i) => (
                <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #333' }}>
                  {hist.command}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '15px' }}>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: '#888' }}>難易度:</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(lvl => (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                disabled={isLoading}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  background: course === lvl ? '#4CAF50' : '#444',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {lvl === 1 ? '🟢' : lvl === 2 ? '🔵' : lvl === 3 ? '🟠' : '💀'} Lv{lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 中央パネル - 3つのレーン */}
      <div className="center-panel">
        {[1, 2, 3].map(laneNum => {
          const laneRamens = getLaneRamens(laneNum)
          return (
            <div 
              key={laneNum} 
              className="lane"
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: '#1a1a1a',
                border: '2px solid #333'
              }}
            >
              <div style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '20px',
                opacity: 0.5
              }}>
                🔥
              </div>

              {laneRamens.map(ramen => {
                const activeRamen = getActiveRamen()
                const isActive = activeRamen?.id === ramen.id
                return (
                  <div 
                    key={ramen.id}
                    style={{
                      position: 'absolute',
                      left: `${ramen.position}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      transition: 'left 0.05s linear',
                      fontSize: isActive ? '45px' : '35px',
                      filter: isActive ? 'drop-shadow(0 0 15px #FFD700) brightness(1.5)' : 'none',
                      zIndex: isActive ? 10 : 1
                    }}
                  >
                    🍜
                    {isActive && (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '-55px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '11px',
                          color: '#00FF00',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          textShadow: '0 0 10px #00FF00',
                          whiteSpace: 'nowrap',
                          background: 'rgba(0,0,0,0.8)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #00FF00'
                        }}>
                          📝 {ramen.command.command}
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: '-30px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '12px',
                          color: '#FFD700',
                          fontWeight: 'bold',
                          textShadow: '0 0 10px #FFD700',
                          whiteSpace: 'nowrap'
                        }}>
                          ⭐操作中
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
              
              <div style={{
                position: 'absolute',
                right: '5px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '30px',
                opacity: 0.5
              }}>
                👤
              </div>

              <div style={{
                position: 'absolute',
                top: '5px',
                left: '5px',
                fontSize: '12px',
                color: '#888'
              }}>
                Lane {laneNum}
              </div>
            </div>
          )
        })}
      </div>

      {/* 右パネル - 利用可能な具材 */}
      <div className="right-panel">
        <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#888', textAlign: 'center' }}>利用可能な具材</h3>
        {AVAILABLE_ITEMS.map(item => {
          const activeRamen = getActiveRamen()
          const isAdded = activeRamen?.stagedItems.includes(item) || false
          return (
            <div 
              key={item}
              style={{
                padding: '8px',
                margin: '5px 0',
                background: isAdded ? '#4CAF50' : '#333',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center',
                color: isAdded ? '#000' : '#fff',
                fontWeight: isAdded ? 'bold' : 'normal'
              }}
            >
              {isAdded && '✓ '}{item}
            </div>
          )
        })}
      </div>

      {/* 下部 - コマンド入力 */}
      <div className="bottom-panel">
        {message && (
          <p style={{ 
            marginBottom: '10px', 
            fontSize: '16px',
            color: message.includes('正解') || message.includes('完了') || message.includes('完璧') ? '#4CAF50' 
                  : message.includes('❌') || message.includes('間違') ? '#f44336' 
                  : '#fff'
          }}>
            {message}
          </p>
        )}
        <p className="input-label">
          ⭐操作中のラーメンのコマンドを入力するか、git add/commit/switchを使用
        </p>
        <form onSubmit={handleSubmit} className="command-form">
          <div className="command-input-wrapper">
            <span className="prompt">&gt;</span>
            <input
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              className="command-input"
              placeholder="例: git add ネギ または git switch lane2"
              autoFocus
              disabled={isLoading || isGameOver}
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default GmScreen
