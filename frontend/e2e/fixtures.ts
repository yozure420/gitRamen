import type { Page, Route } from '@playwright/test'

export const NEWS_RESPONSE = {
  git: [{ source: 'git', title: 'Git 2.51.0 がリリースされました', url: 'https://example.test/git', published_at: null }],
  github: [{ source: 'github', title: 'GitHub Actions の更新', url: 'https://example.test/gh', published_at: '2026-09-10T00:00:00+00:00' }],
  gitramen: [{ source: 'gitramen', title: 'feat: 更新情報の欄を追加', url: 'https://example.test/commit', published_at: '2026-09-15T00:00:00+00:00' }],
  status: {
    indicator: 'none',
    description: 'All Systems Operational',
    components: [{ name: 'Git Operations', status: 'operational' }],
  },
  unavailable: [] as string[],
  fetched_at: '2026-09-16T00:00:00+00:00',
}

const COURSE_COMMANDS = [
  { id: 3, command: 'git status', description: '状態確認', game_note: '伝票を見る', course: 1, playable: true },
  { id: 4, command: 'git add <file>', description: '具材追加', game_note: '具材を入れる', course: 1, playable: true },
  { id: 40, command: 'git stash', description: '一時退避', game_note: '作りかけを退避', course: 2, playable: true },
]

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

/**
 * 外部 API に依存せず画面を検証するため、バックエンドのレスポンスを固定する。
 * glob（**\/api/news*）だとソースの /src/api/news.ts まで一致してしまうため、
 * パスの末尾まで見る正規表現でマッチさせる。
 */
export async function mockApi(page: Page, options: { news?: unknown | 'error' } = {}) {
  await page.route(/\/api\/news(\?.*)?$/, route => {
    if (options.news === 'error') {
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"unavailable"}' })
    }
    return json(route, options.news ?? NEWS_RESPONSE)
  })
  await page.route(/\/api\/commands\/random(\?.*)?$/, route => json(route, COURSE_COMMANDS))
  await page.route(/\/api\/commands\/course(\?.*)?$/, route => json(route, COURSE_COMMANDS))
  await page.route(/\/api\/history$/, route => json(route, { ok: true }))
}
