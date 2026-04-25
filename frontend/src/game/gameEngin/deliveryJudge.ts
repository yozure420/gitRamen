import type { Ramen } from '../../types/interface'
import {
  EMPTY_PUSH_PENALTY,
  INCOMPLETE_WORKFLOW_PENALTY,
  MISSING_TOPPING_PENALTY,
  SUCCESS_DELIVERY_POINT,
  WRONG_BRANCH_PUSH_PENALTY,
} from './deliveryConstants'
import { getRequiredToppingForRamen, isWorkflowCompleted } from './workflow'
import type { DeliveryOutcome } from './types'

export function evaluateDelivery(ramen: Ramen, course: number): DeliveryOutcome {
  if (ramen.isPushed && !ramen.isCommitted) {
    const penalty = EMPTY_PUSH_PENALTY * course
    return {
      scoreDelta: -penalty,
      result: 'failed',
      summary: '空振りプッシュ: 未コミットのまま配達',
      message: `💥 空振りプッシュ！中身が入っていない！ (-${penalty}点)`,
      customerWarning: '中身が入っていない！まずい！',
      errorLabel: '空振りプッシュ',
    }
  }

  if (ramen.isPushed && ramen.pushedToMainFromOtherLane) {
    const penalty = WRONG_BRANCH_PUSH_PENALTY * course
    return {
      scoreDelta: -penalty,
      result: 'failed',
      summary: '誤配達: 別レーンから origin main へ push',
      message: `❌ 注文ミス！別レーンから main へ届けてしまいました (-${penalty}点)`,
      customerWarning: '注文が間違ってる！main宛てになってる💢',
      errorLabel: 'push先ミス',
    }
  }

  if (!isWorkflowCompleted(ramen)) {
    return {
      scoreDelta: -INCOMPLETE_WORKFLOW_PENALTY,
      result: 'failed',
      summary: 'ワークフロー未完了で配達失敗',
      message: '❌ 失敗！必要な手順を完了する前に流れてしまいました (-50点)',
    }
  }

  if (ramen.currentLane === ramen.targetLane) {
    const requiredTopping = getRequiredToppingForRamen(ramen)
    if (requiredTopping && !ramen.stagedItems.includes(requiredTopping)) {
      const penalty = MISSING_TOPPING_PENALTY * course
      return {
        scoreDelta: -penalty,
        result: 'failed',
        summary: `味判定失敗: ${requiredTopping}なし`,
        message: `🤢 まずい…「${requiredTopping}」が入ってない！ (-${penalty}点)`,
      }
    }

    const point = SUCCESS_DELIVERY_POINT * course
    return {
      scoreDelta: point,
      result: 'delivered',
      summary: `味判定成功: うまい / Lane ${ramen.targetLane}`,
      message: `😋 うまい！Lane ${ramen.targetLane} のお客さんに届きました！ +${point}点`,
    }
  }

  return {
    scoreDelta: -INCOMPLETE_WORKFLOW_PENALTY,
    result: 'failed',
    summary: `配達先ミス: Lane ${ramen.targetLane}`,
    message: `❌ 誤配達！Lane ${ramen.targetLane} の注文なのに別レーンへ届けました (-50点)`,
    customerWarning: 'これ頼んでないんだけど💢',
    errorLabel: '誤配達',
  }
}
