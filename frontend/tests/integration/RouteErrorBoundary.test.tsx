// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RouteErrorBoundary from '../../src/components/RouteErrorBoundary'

function Bomb(): never {
  throw new Error('boom')
}

const reload = vi.fn()

beforeEach(() => {
  reload.mockReset()
  vi.stubGlobal('location', { ...window.location, reload })
  // React が捕捉した例外をコンソールに出すのを抑える
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('RouteErrorBoundary', () => {
  it('子が例外を投げなければ子をそのまま表示する', () => {
    render(<RouteErrorBoundary><p>ok</p></RouteErrorBoundary>)

    expect(screen.getByText('ok')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('子が例外を投げたらフォールバックを表示する', () => {
    render(<RouteErrorBoundary><Bomb /></RouteErrorBoundary>)

    expect(screen.getByRole('alert').textContent).toContain('画面を読み込めませんでした。')
  })

  it('再読み込みボタンで location.reload を呼ぶ', () => {
    render(<RouteErrorBoundary><Bomb /></RouteErrorBoundary>)

    fireEvent.click(screen.getByRole('button', { name: '再読み込み' }))

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
