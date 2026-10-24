// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import GmOrderPanelV2 from '../../src/components/gmV2/GmOrderPanelV2'
import { buildCookingSteps } from '../../src/game/commandLogic/orderEvents'
import { createStep } from '../../src/game/commandLogic/stepFactory'
import type { Command, Ramen } from '../../src/types/interface'
import { makeRamen } from '../helpers/ramen'

beforeAll(() => {
  // jsdom は scrollTo を実装していない
  Element.prototype.scrollTo = () => {}
})

afterEach(cleanup)

const meta = { baseRamen: '豚骨ラーメン', topping: 'ネギ', call: '豚骨ラーメンネギ入りおまち！' }

function renderPanel(props: { ramen: Ramen | null; showHelp?: boolean; courseCommands?: Command[] }) {
  return render(
    <MemoryRouter>
      <GmOrderPanelV2
        ramen={props.ramen}
        lanes={['main']}
        showHelp={props.showHelp ?? false}
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
})
