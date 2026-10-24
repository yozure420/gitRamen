// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Registration from '../../src/pages/Registration'

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as Response)
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(cleanup)

function submitWith(password: string) {
  const { container } = render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('ユーザーネーム'), { target: { value: 'tester' } })
  fireEvent.change(document.getElementById('reg-password')!, { target: { value: password } })
  fireEvent.change(document.getElementById('reg-confirm-password')!, { target: { value: password } })
  fireEvent.submit(container.querySelector('form')!)
}

describe('Registration: パスワードの UTF-8 バイト数上限', () => {
  it('73 バイトならエラーを表示し、送信しない', async () => {
    submitWith('a'.repeat(73))
    expect(await screen.findByText(/パスワードが長すぎます/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('全角 25 文字（75 バイト）ならエラーを表示し、送信しない', async () => {
    submitWith('あ'.repeat(25))
    expect(await screen.findByText(/パスワードが長すぎます/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('72 バイトちょうどなら送信する', async () => {
    submitWith('a'.repeat(72))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/パスワードが長すぎます/)).toBeNull()
  })
})
