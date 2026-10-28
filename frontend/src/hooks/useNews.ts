import { useEffect, useState } from 'react'
import { fetchNews } from '../api/news'
import type { NewsResponse } from '../api/news'

export type NewsState = {
  news: NewsResponse | null
  error: string | null
}

/**
 * 更新情報を画面の表示中に1回だけ取得する。
 * パネルは注文が入るたびに外れて付け直されるので、パネル側で取得すると注文のたびに再取得になる。
 */
export function useNews(): NewsState {
  const [state, setState] = useState<NewsState>({ news: null, error: null })

  useEffect(() => {
    let cancelled = false
    fetchNews()
      .then(news => { if (!cancelled) setState({ news, error: null }) })
      .catch(err => {
        if (!cancelled) setState({ news: null, error: err instanceof Error ? err.message : '更新情報を取得できませんでした' })
      })
    return () => { cancelled = true }
  }, [])

  return state
}
