// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import GmStart from '../../src/pages/GmStart'

function GameProbe() {
  const location = useLocation()
  const course = (location.state as { course?: number } | null)?.course
  return <div data-testid="game">course={course}</div>
}

function renderStart() {
  render(
    <MemoryRouter initialEntries={['/start']}>
      <Routes>
        <Route path="/start" element={<GmStart />} />
        <Route path="/game" element={<GameProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

function submit(command: string) {
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: command } })
  fireEvent.submit(input.closest('form')!)
}

afterEach(cleanup)

describe('GmStart: コマンドでコースを選んでゲーム画面へ遷移する', () => {
  it.each([
    ['git clone easy', 1],
    ['git clone normal', 2],
  ])('%s → course=%i', (command, course) => {
    renderStart()
    submit(command)
    expect(screen.getByTestId('game').textContent).toBe(`course=${course}`)
  })

  it.each([
    ['git remote add high', 3],
    ['git remote add god', 4],
  ])('git init → %s → course=%i', (command, course) => {
    renderStart()
    submit('git init')
    expect(screen.getByRole('heading').textContent).toContain('リモート設定')

    submit(command)
    expect(screen.getByTestId('game').textContent).toBe(`course=${course}`)
  })

  it('全角スペース・大文字でも受け付ける', () => {
    renderStart()
    submit('GIT　clone  NORMAL')
    expect(screen.getByTestId('game').textContent).toBe('course=2')
  })

  it('無効なコマンドはエラー表示のまま留まる', () => {
    renderStart()
    submit('git clone hard')
    expect(screen.queryByTestId('game')).toBeNull()
    expect(screen.getByText(/無効なコマンドです/)).toBeTruthy()
  })
})
