// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import GmOrderPanelV2 from '../../src/components/gmV2/GmOrderPanelV2'
import { buildCookingSteps } from '../../src/game/commandLogic/orderEvents'
import { createStep } from '../../src/game/commandLogic/stepFactory'
import type { Command, Ramen } from '../../src/types/interface'
import { makeRamen } from '../helpers/ramen'
import { fetchNews } from '../../src/api/news'
import type { NewsResponse } from '../../src/api/news'

vi.mock('../../src/api/news', () => ({ fetchNews: vi.fn() }))

const fetchNewsMock = vi.mocked(fetchNews)

const newsResponse: NewsResponse = {
  git: [{ source: 'git', title: 'Git 2.51.0 がリリースされました', url: 'https://example.test/git', published_at: null }],
  github: [],
  gitramen: [],
  status: { indicator: 'none', description: 'All Systems Operational', components: [] },
  unavailable: [],
  fetched_at: '2026-09-16T00:00:00+00:00',
}

const NEWS_LABEL = 'Git / GitHub の更新情報'

beforeEach(() => { fetchNewsMock.mockReset(); fetchNewsMock.mockResolvedValue(newsResponse) })

beforeAll(() => {
  // jsdom は scrollTo を実装していない
  Element.prototype.scrollTo = () => {}
})

afterEach(cleanup)

const meta = { baseRamen: '豚骨ラーメン', topping: 'ネギ', call: '豚骨ラーメンネギ入りおまち！' }

function renderPanel(props: { ramen: Ramen | null; showHelp?: boolean; showNews?: boolean; courseCommands?: Command[] }) {
  return render(
    <MemoryRouter>
      <GmOrderPanelV2
        ramen={props.ramen}
        lanes={['main']}
        showHelp={props.showHelp ?? false}
        showNews={props.showNews ?? false}
        courseCommands={props.courseCommands ?? []}
        isPaused={false}
        resumeGame={() => {}}
      />
    </MemoryRouter>,
  )
}

describe('GmOrderPanelV2', () => {
  it('注文がなければ git pull を促す', () => {
    renderPanel({ ramen: null })
    expect(screen.getByText(/git pull で注文を受け取れ/)).toBeTruthy()
  })

  it('コール間違いの注文でも、タイトルは最後の正しいコールを表示し、完了済み手順に打ち消し線クラスを付ける', () => {
    const steps = [
      ...buildCookingSteps('reset_soft', { meta, laneLabel: 'mainレーン', branchName: 'main' }),
      createStep({ type: 'push', displayCommand: 'git push origin main', logicLabel: 'p', logicDescription: 'p' }),
    ]
    const { container } = renderPanel({ ramen: makeRamen(steps, { currentStepIndex: 2, isCommitted: true }) })

    expect(container.querySelector('.receipt-slip-title')?.textContent).toBe(meta.call)
    const rows = Array.from(container.querySelectorAll('.receipt-slip-command'))
    expect(rows.map(row => row.classList.contains('receipt-slip-command-completed'))).toEqual([true, true, false, false, false])
    expect(rows.at(-1)?.textContent).toContain('git push origin main')
  })

  it('ヘルプ表示では渡されたコマンド一覧をそのまま表示する', () => {
    renderPanel({
      ramen: null,
      showHelp: true,
      courseCommands: [
        { id: 3, command: 'git status', description: 'd', game_note: '伝票', course: 1 },
        { id: 40, command: 'git stash', description: 'd', game_note: '退避', course: 2 },
      ],
    })
    expect(screen.getByText('git status')).toBeTruthy()
    expect(screen.getByText('git stash')).toBeTruthy()
  })

  describe('更新情報', () => {
    it('注文が無く showNews が true なら、待機メッセージの下に更新情報を表示する', async () => {
      renderPanel({ ramen: null, showNews: true })
      expect(screen.getByRole('complementary', { name: NEWS_LABEL })).toBeTruthy()
      expect(screen.getByText(/git pull で注文を受け取れ/)).toBeTruthy()
      await waitFor(() => expect(screen.getByText('Git 2.51.0 がリリースされました')).toBeTruthy())
    })

    it('showNews が false なら注文が無くても更新情報を表示しない', () => {
      renderPanel({ ramen: null, showNews: false })
      expect(screen.queryByRole('complementary', { name: NEWS_LABEL })).toBeNull()
      expect(screen.getByText(/git pull で注文を受け取れ/)).toBeTruthy()
    })

    it('注文がある間は showNews が true でも更新情報を表示しない', () => {
      const steps = [
        ...buildCookingSteps('reset_soft', { meta, laneLabel: 'mainレーン', branchName: 'main' }),
        createStep({ type: 'push', displayCommand: 'git push origin main', logicLabel: 'p', logicDescription: 'p' }),
      ]
      renderPanel({ ramen: makeRamen(steps), showNews: true })
      expect(screen.queryByRole('complementary', { name: NEWS_LABEL })).toBeNull()
    })

    it('ヘルプ表示中は showNews が true でも更新情報を表示しない', () => {
      renderPanel({ ramen: null, showHelp: true, showNews: true })
      expect(screen.queryByRole('complementary', { name: NEWS_LABEL })).toBeNull()
    })
  })
})
