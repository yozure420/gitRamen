import { lazy } from 'react'
import type { ComponentType } from 'react'

const RELOADED_KEY = 'gitramen:chunk-reloaded'

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(RELOADED_KEY) === '1'
  } catch {
    return false
  }
}

function writeFlag(reloaded: boolean): boolean {
  try {
    if (reloaded) sessionStorage.setItem(RELOADED_KEY, '1')
    else sessionStorage.removeItem(RELOADED_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * lazy() の読み込み失敗時に一度だけページを再読み込みする。
 *
 * デプロイ後は古いハッシュ付きチャンクがサーバーから消えるため、開きっぱなしのタブで
 * 画面遷移すると import() が失敗する。再読み込みすれば新しい index.html とチャンクを取り直せる。
 * 再読み込みしても失敗する場合（オフラインなど）はループさせず、エラーをそのまま投げる。
 */
export function lazyWithReload<T extends ComponentType>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const module = await load()
      writeFlag(false)
      return module
    } catch (error) {
      // フラグを保存できない環境では再読み込みのループを止められないので、再読み込みしない
      if (!readFlag() && writeFlag(true)) {
        window.location.reload()
        // 再読み込みが始まるまでフォールバック表示のままにする
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }
  })
}
