import type { Dispatch, SetStateAction } from 'react'
import type { Command, CommandHistory, Ramen, StatusWindowData } from '../types/interface'
import { advanceWorkflow, getCurrentCommandStep } from './gameEngine'

export function normalizeCommand(input: string): string {
  return input
    .replace(/\u3000/g, ' ') // 全角スペースを半角に
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

type ExecuteGameCommandParams = {
  cmd: string
  normalizedCmd: string
  isGameOver: boolean
  course: number
  existingBranches: string[]
  showHelp: boolean
  availableCommands: Command[]
  availableItems: string[]
  maxLanes: number
  pushSpeed: number
  onPullOrder: () => string
  getActiveRamen: () => Ramen | null
  setInputCommand: (value: string) => void
  setCommandHistory: Dispatch<SetStateAction<CommandHistory[]>>
  setMessage: (value: string) => void
  setRamens: Dispatch<SetStateAction<Ramen[]>>
  setScore: Dispatch<SetStateAction<number>>
  setShowHelp: (value: boolean) => void
  setShowLog: (value: boolean) => void
  setIsCompactLog: (value: boolean) => void
  setLaneCount: (value: number) => void
  setExistingBranches: Dispatch<SetStateAction<string[]>>
  setIsPaused: (value: boolean) => void
  setStatusWindow: Dispatch<SetStateAction<StatusWindowData | null>>
  recordMissByCommandId: (commandId: number) => void
}

/**
 * プレイヤーが入力した1コマンドを処理するエントリポイント。
 *
 * 構成:
 *   1. 共有ヘルパー   … どのハンドラからも使う小さな関数群
 *   2. コマンドハンドラ … コマンド種別ごとの処理（`handleXxx`）。処理したら true を返す
 *   3. ディスパッチ    … ハンドラを「判定順」に呼び出す。※順序に依存するので変更注意
 *   4. フォールバック   … どのハンドラにも当てはまらなかった場合
 */
export function executeGameCommand(params: ExecuteGameCommandParams): void {
  const {
    cmd,
    normalizedCmd,
    isGameOver,
    course,
    existingBranches,
    showHelp,
    availableCommands,
    availableItems,
    maxLanes,
    pushSpeed,
    onPullOrder,
    getActiveRamen,
    setInputCommand,
    setCommandHistory,
    setMessage,
    setRamens,
    setScore,
    setShowHelp,
    setShowLog,
    setIsCompactLog,
    setLaneCount,
    setExistingBranches,
    setIsPaused,
    setStatusWindow,
    recordMissByCommandId,
  } = params

  if (!cmd.trim() || isGameOver) return

  setCommandHistory(prev => [...prev, { command: cmd, timestamp: new Date() }])

  const activeRamen = getActiveRamen()
  const currentStep = activeRamen ? getCurrentCommandStep(activeRamen) : null

  // ===== 1. 共有ヘルパー =====================================================

  /** 入力が、対象ラーメンの「今やるべきステップ」に一致するか */
  const isCurrentStepMatch = (ramen: Ramen | null, input: string): boolean => {
    const step = ramen ? getCurrentCommandStep(ramen) : null
    return step?.expectedInputs.some(expected => normalizeCommand(expected) === input) ?? false
  }

  /** 次のステップの表示コマンド（無ければ null） */
  const getNextStepCommand = (ramen: Ramen): string | null => {
    return ramen.steps[ramen.currentStepIndex + 1]?.displayCommand ?? null
  }

  /** メッセージ末尾に「次: <コマンド>」を付ける（次が無ければそのまま） */
  const appendNextHint = (baseMessage: string, ramen: Ramen, connector = '。'): string => {
    const nextStep = getNextStepCommand(ramen)
    return nextStep ? `${baseMessage}${connector}次: ${nextStep}` : baseMessage
  }

  /** ブランチ名（または laneN エイリアス）から対応するレーン番号を引く（無ければ -1） */
  const getBranchLane = (branchName: string): number => {
    const laneAliasMatch = normalizeCommand(branchName).match(/^lane([1-9]\d*)$/)
    if (laneAliasMatch) {
      const laneFromAlias = Number(laneAliasMatch[1])
      if (laneFromAlias >= 1 && laneFromAlias <= existingBranches.length) {
        return laneFromAlias
      }
    }

    const branchIndex = existingBranches.findIndex((branch) => normalizeCommand(branch) === normalizeCommand(branchName))
    return branchIndex >= 0 ? branchIndex + 1 : -1
  }

  /** 「main(Lane 1), akamaru-42(Lane 2)」のようなレーン一覧テキスト */
  const toBranchListText = (): string => {
    return existingBranches
      .map((branch, index) => `${branch}(Lane ${index + 1})`)
      .join(', ')
  }

  /** ミス数をコマンドID単位で記録する（省略時は対象ラーメンに対して） */
  const recordMiss = (ramen: Ramen | null = activeRamen) => {
    if (!ramen?.command?.id) return
    recordMissByCommandId(ramen.command.id)
  }

  /** 対象ラーメンのステップを1つ進めてスコア加算・メッセージ表示までまとめて行う */
  const completeCurrentStep = (ramen: Ramen, options?: {
    scoreDelta?: number
    message: string
    update?: (current: Ramen) => Partial<Ramen>
  }) => {
    const { scoreDelta = 50 * course, message, update } = options ?? { message: '' }

    if (scoreDelta !== 0) {
      setScore(prev => prev + scoreDelta)
    }

    setRamens(prev => prev.map(current => {
      if (current.id !== ramen.id) return current
      return advanceWorkflow(current, {
        commandsExecuted: current.commandsExecuted + 1,
        ...(update ? update(current) : {}),
      })
    }))

    setMessage(message)
    setInputCommand('')
  }

  /** メッセージを出して入力欄をクリア（ミスとしては記録しない） */
  const notify = (message: string) => {
    setMessage(message)
    setInputCommand('')
  }

  /** ミスを記録したうえでメッセージを出して入力欄をクリア */
  const rejectWithMiss = (message: string) => {
    recordMiss(activeRamen)
    notify(message)
  }

  /**
   * add / commit / push が「手順の順番」を飛ばしていないか判定する。
   * 順番違反なら true（＝呼び出し側で処理を打ち切る）。
   */
  const rejectOutOfOrder = (stepType: 'add' | 'commit' | 'push'): boolean => {
    if (!currentStep) return false
    if (currentStep.type === stepType) return false

    if (stepType === 'add') {
      rejectWithMiss(`❌ まだ add の番ではありません。今は「${currentStep.displayCommand}」です`)
    } else if (stepType === 'commit') {
      rejectWithMiss(`❌ まだ commit できません。先に「${currentStep.displayCommand}」を完了してください`)
    } else {
      rejectWithMiss(`❌ まだ push できません。先に「${currentStep.displayCommand}」を完了してください`)
    }
    return true
  }

  // ===== 2. コマンドハンドラ =================================================
  // 各ハンドラは「自分の担当コマンドを処理したら true、対象外なら false」を返す。

  /** git pull … 新しい注文を受け取る */
  const handlePull = (): boolean => {
    if (normalizedCmd !== 'git pull') return false

    if (activeRamen) {
      notify('⚠️ 既に調理中の注文があります。先にこの一杯を届けてください')
      return true
    }

    notify(onPullOrder())
    return true
  }

  /** git clone … ゲーム中は使用不可（開始前の難易度選択専用） */
  const handleClone = (): boolean => {
    if (!cmd.match(/^git clone .+$/i)) return false

    notify('⛔ git clone はゲーム開始前の難易度選択専用です')
    return true
  }

  /** git add <具材> … 具材をステージに載せる */
  const handleAdd = (): boolean => {
    const addMatch = cmd.match(/^git add (.+)$/i)
    if (!addMatch) return false

    if (!activeRamen) {
      notify('❌ 操作できるラーメンがありません')
      return true
    }
    if (rejectOutOfOrder('add')) return true

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      rejectWithMiss(`❌ 今必要なのは「${currentStep?.displayCommand ?? ''}」です`)
      return true
    }

    const item = addMatch[1].trim()

    if (item === '.') {
      completeCurrentStep(activeRamen, {
        message: appendNextHint('✅ 全マシ全のせ！', activeRamen, ' '),
        update: () => ({ stagedItems: [...availableItems] }),
      })
    } else if (availableItems.includes(item)) {
      if (activeRamen.stagedItems.includes(item)) {
        notify(`⚠️ ${item}は既に追加されています`)
        return true
      }
      completeCurrentStep(activeRamen, {
        message: appendNextHint(`✅ ${item}を追加しました`, activeRamen),
        update: (current) => ({ stagedItems: [...current.stagedItems, item] }),
      })
    } else {
      rejectWithMiss(`❌ ${item}という具材はありません`)
    }
    return true
  }

  /** git commit -m "..." … 注文内容を確定する */
  const handleCommit = (): boolean => {
    const commitMatch = cmd.match(/^git commit -m "(.+)"$/i)
    if (!commitMatch) return false

    if (!activeRamen) {
      notify('❌ 操作できるラーメンがありません')
      return true
    }
    if (rejectOutOfOrder('commit')) return true

    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      rejectWithMiss(`❌ 今必要な commit は「${currentStep?.displayCommand ?? ''}」です`)
      return true
    }

    const callText = commitMatch[1]
    completeCurrentStep(activeRamen, {
      message: appendNextHint(`🍜 ${callText}`, activeRamen, ' '),
      update: () => ({ isCommitted: true }),
    })
    return true
  }

  /** git checkout -b <branch> … 新規レーンを作成して同時に切り替える */
  const handleCheckoutNewBranch = (): boolean => {
    const match = cmd.match(/^git checkout -b (.+)$/i)
    if (!match) return false

    if (!activeRamen) {
      notify('❌ 操作できるラーメンがありません')
      return true
    }

    const branchName = match[1].trim()
    if (!branchName) {
      rejectWithMiss('❌ ブランチ名を入力してください')
      return true
    }
    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      rejectWithMiss(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
      return true
    }
    if (getBranchLane(branchName) > 0) {
      rejectWithMiss(`❌ ${branchName} は既に存在します`)
      return true
    }
    if (existingBranches.length >= maxLanes) {
      rejectWithMiss(`ℹ️ 既に最大レーン数（${maxLanes}）です。既存ブランチへ checkout してください`)
      return true
    }

    const nextBranches = [...existingBranches, branchName]
    const nextLane = nextBranches.length
    setExistingBranches(nextBranches)
    setLaneCount(nextLane)

    completeCurrentStep(activeRamen, {
      message: appendNextHint(`🆕 ${branchName} を作成して Lane ${nextLane} へ切替`, activeRamen),
      update: () => ({ currentLane: nextLane }),
    })
    return true
  }

  /** git switch|checkout <branch> … 既存レーンへ切り替える */
  const handleSwitchLane = (): boolean => {
    const match = cmd.match(/^git (switch|checkout) (.+)$/i)
    if (!match) return false

    const branchName = match[2].trim()
    const targetLane = getBranchLane(branchName)

    if (targetLane <= 0) {
      rejectWithMiss(`❌ ${branchName} は存在しません。既存: ${toBranchListText()}`)
      return true
    }
    if (!activeRamen) {
      notify('❌ 移動できるラーメンがありません')
      return true
    }
    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      rejectWithMiss(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
      return true
    }

    completeCurrentStep(activeRamen, {
      message: appendNextHint(`🔀 ${branchName} (Lane ${targetLane}) へ切替`, activeRamen),
      update: () => ({ currentLane: targetLane }),
    })
    return true
  }

  /** git branch （引数なし）… レーン一覧を表示する */
  const handleBranchList = (): boolean => {
    if (normalizedCmd !== 'git branch') return false

    const laneList = toBranchListText()
    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      completeCurrentStep(activeRamen, {
        message: appendNextHint(`🌿 現在のレーン: ${laneList}`, activeRamen),
      })
    } else {
      notify(`🌿 現在のレーン: ${laneList}`)
    }
    return true
  }

  /** git branch <name> … 新規レーンを開設する（切り替えはしない） */
  const handleCreateBranch = (): boolean => {
    const match = cmd.match(/^git branch (.+)$/i)
    if (!match) return false

    const branchName = match[1].trim()
    if (!branchName) {
      rejectWithMiss('❌ ブランチ名を入力してください')
      return true
    }
    if (!activeRamen) {
      notify('❌ 操作できるラーメンがありません')
      return true
    }
    if (!isCurrentStepMatch(activeRamen, normalizedCmd)) {
      rejectWithMiss(`❌ 今は「${currentStep?.displayCommand ?? ''}」の番です`)
      return true
    }
    if (getBranchLane(branchName) > 0) {
      notify(`ℹ️ ${branchName} は既に存在します`)
      return true
    }
    if (existingBranches.length >= maxLanes) {
      notify(`ℹ️ 既に最大レーン数（${maxLanes}）です`)
      return true
    }

    const nextBranches = [...existingBranches, branchName]
    const nextLane = nextBranches.length
    setExistingBranches(nextBranches)
    setLaneCount(nextLane)

    completeCurrentStep(activeRamen, {
      message: appendNextHint(`🆕 ${branchName} (Lane ${nextLane}) を開設`, activeRamen),
    })
    return true
  }

  /** git help … ヒント表示をトグルする（表示中はゲームを一時停止） */
  const handleHelp = (): boolean => {
    if (normalizedCmd !== 'git help') return false

    const nextShow = !showHelp
    setShowHelp(nextShow)
    setIsPaused(nextShow)
    notify(nextShow ? '💡 ヒントを表示（一時停止中）' : 'ヒントを非表示')
    return true
  }

  /** git log … 注文履歴（レシート）を表示する */
  const handleLog = (): boolean => {
    if (normalizedCmd !== 'git log') return false

    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      completeCurrentStep(activeRamen, {
        message: appendNextHint('📜 注文履歴を表示', activeRamen),
      })
    } else {
      notify('📜 注文履歴を表示')
    }
    setIsPaused(false)
    setIsCompactLog(false)
    setShowLog(true)
    return true
  }

  /** git log --oneline … レシートを簡易表示する */
  const handleCompactLog = (): boolean => {
    if (normalizedCmd !== 'git log --oneline') return false

    if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
      completeCurrentStep(activeRamen, {
        message: appendNextHint('👋 おかえりでーす！レシート簡易表示', activeRamen),
      })
    } else {
      notify('🧾 レシート簡易表示')
    }
    setIsPaused(false)
    setIsCompactLog(true)
    setShowLog(true)
    return true
  }

  /** git status … 厨房（対象ラーメン）の状態を伝票ウィンドウで表示する */
  const handleStatus = (): boolean => {
    if (normalizedCmd !== 'git status') return false

    if (!activeRamen) {
      setMessage('📊 お腹すいた～')
      setStatusWindow({
        title: '伝票 / git status',
        phaseMessage: '厨房の状態: まだ調理中の注文がありません。',
        details: ['注文待機中'],
      })
      setTimeout(() => setStatusWindow(null), 2300)
      setInputCommand('')
      return true
    }

    const requiredItems = activeRamen.steps
      .filter(step => step.type === 'add' && step.itemName)
      .map(step => step.itemName as string)
    const uniqueItems = Array.from(new Set([...requiredItems, ...activeRamen.stagedItems]))

    const phaseMessage = (() => {
      if (activeRamen.stagedItems.length === 0) {
        return '厨房の状態: まだ具材が選ばれていません！ git add で具材を乗せてください。'
      }
      if (!activeRamen.isCommitted) {
        return '厨房の状態: 具材は乗っています！ あとは git commit -m で注文を確定させてください。'
      }
      if (!activeRamen.isPushed) {
        return '厨房の状態: 調理完了！ 爆速で git push してお客さんに届けてください！'
      }
      return '厨房の状態: 配達中です。無事に届くか見守りましょう。'
    })()

    const itemDetails = uniqueItems.length > 0
      ? uniqueItems.map(item => `具材：[${item}] (${activeRamen.stagedItems.includes(item) ? '投入済み' : '未投入'})`)
      : ['具材：[なし] (未投入)']

    const details = [
      `対象ラーメン: #${activeRamen.id} / Lane${activeRamen.currentLane} -> Lane${activeRamen.targetLane}`,
      `isCommitted: ${activeRamen.isCommitted ? 'true' : 'false'}`,
      `isPushed: ${activeRamen.isPushed ? 'true' : 'false'}`,
      ...itemDetails,
    ]

    setStatusWindow({ title: '伝票 / git status', phaseMessage, details })
    setTimeout(() => setStatusWindow(null), 2600)
    setMessage(`📊 状態確認: ${phaseMessage}`)

    if (isCurrentStepMatch(activeRamen, normalizedCmd)) {
      completeCurrentStep(activeRamen, {
        message: appendNextHint('📊 状態確認完了', activeRamen),
      })
      return true
    }

    setInputCommand('')
    return true
  }

  /** git push origin <branch> … 調理済みのラーメンを配達する */
  const handlePush = (): boolean => {
    const match = cmd.match(/^git push origin (.+)$/i)
    if (!match) return false

    if (!activeRamen) {
      notify('❌ 配達できるラーメンがありません')
      return true
    }

    const targetBranch = match[1].trim()              // 入力された push 先ブランチ名
    const currentBranchName = existingBranches[activeRamen.currentLane - 1] || 'main' // 今いるブランチ名

    // 今いるレーンと違うブランチに push しようとした場合はエラー
    if (normalizeCommand(targetBranch) !== normalizeCommand(currentBranchName)) {
      notify(`❌ 今いるのは ${currentBranchName} です。${targetBranch} に push するには、先に ${targetBranch} ブランチに移動してください！`)
      return true
    }

    // ブランチ名一致を通過しているので「他レーンから main へ流した」誤配達は起こり得ない
    const pushedToMainFromOtherLane = false

    const isCurrentPushStep = currentStep?.type === 'push' && isCurrentStepMatch(activeRamen, normalizedCmd)
    if (isCurrentPushStep) {
      completeCurrentStep(activeRamen, {
        scoreDelta: 0,
        message: '🚀 push 完了！お客さんのところへ急げーー！！',
        update: () => ({ speed: pushSpeed, isPushed: true, pushedToMainFromOtherLane }),
      })
      return true
    }

    // 手順の途中でも push 自体は実行できる（未コミットならこの後ミス扱い）
    setRamens(prev => prev.map(r => {
      if (r.id !== activeRamen.id) return r
      return { ...r, speed: pushSpeed, isPushed: true, pushedToMainFromOtherLane }
    }))

    if (!activeRamen.isCommitted) {
      rejectWithMiss('💢 トッピングはどうした💢 空のまま push してしまった！')
    } else {
      notify('🚀 push を実行！ものすごい勢いで流れていく！')
    }
    return true
  }

  // ===== 3. ディスパッチ（判定順に依存するため並び順を変えないこと）=========
  const handlers = [
    handlePull,
    handleClone,
    handleAdd,
    handleCommit,
    handleCheckoutNewBranch,
    handleSwitchLane,
    handleBranchList,
    handleCreateBranch,
    handleHelp,
    handleLog,
    handleCompactLog,
    handleStatus,
    handlePush,
  ]

  for (const handle of handlers) {
    if (handle()) return
  }

  // ===== 4. フォールバック ===================================================

  // 専用ハンドラは無いが、対象ラーメンの現在ステップにそのまま一致する汎用コマンド
  if (activeRamen && isCurrentStepMatch(activeRamen, normalizedCmd)) {
    const nextStep = getNextStepCommand(activeRamen)
    completeCurrentStep(activeRamen, {
      message: nextStep
        ? `✅ 「${cmd}」完了！次: ${nextStep}`
        : `✅ 正解！「${cmd}」を実行しました！`,
    })
    return
  }

  const matchingCmd = availableCommands.find(c => normalizeCommand(c.command) === normalizedCmd)

  if (currentStep) {
    rejectWithMiss(`❌ 今は「${currentStep.displayCommand}」の番です`)
  } else if (matchingCmd) {
    rejectWithMiss('❌ そのコマンドは今じゃない！現在のラーメンのコマンドを入力してください')
  } else {
    rejectWithMiss(`❓ 不明なコマンド: ${cmd}`)
  }
}
