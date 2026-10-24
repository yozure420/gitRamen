// @vitest-environment jsdom
import { Suspense } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lazyWithReload } from '../../src/lazyWithReload'
import RouteErrorBoundary from '../../src/components/RouteErrorBoundary'

const KEY = 'gitramen:chunk-reloaded'
const reload = vi.fn()

function Loaded() {
  return <p>loaded</p>
}

function renderLazy(load: () => Promise<{ default: () => React.JSX.Element }>) {
  const Lazy = lazyWithReload(load)
  return render(
    <RouteErrorBoundary>
      <Suspense fallback={<p>loading</p>}>
        <Lazy />
      </Suspense>
    </RouteErrorBoundary>,
  )
}

beforeEach(() => {
  reload.mockReset()
  sessionStorage.clear()
  vi.stubGlobal('location', { ...window.location, reload })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('lazyWithReload', () => {
  it('読み込みに成功したらコンポーネントを表示し reload しない', async () => {
    renderLazy(async () => ({ default: Loaded }))

    await waitFor(() => expect(screen.getByText('loaded')).toBeTruthy())
    expect(reload).not.toHaveBeenCalled()
  })

  it('成功したら立っていたフラグを消す', async () => {
    sessionStorage.setItem(KEY, '1')
    renderLazy(async () => ({ default: Loaded }))

    await waitFor(() => expect(screen.getByText('loaded')).toBeTruthy())
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('初回の失敗ではフラグを立てて reload を呼び、フォールバックのまま待つ', async () => {
    renderLazy(() => Promise.reject(new Error('chunk gone')))

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(sessionStorage.getItem(KEY)).toBe('1')
    expect(screen.getByText('loading')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('フラグが立っている状態の失敗では reload せず例外になる（エラー境界が受ける）', async () => {
    sessionStorage.setItem(KEY, '1')
    renderLazy(() => Promise.reject(new Error('chunk gone')))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(reload).not.toHaveBeenCalled()
  })

  it('sessionStorage が例外を投げる環境では reload しない', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    renderLazy(() => Promise.reject(new Error('chunk gone')))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(reload).not.toHaveBeenCalled()
  })

  it('sessionStorage が使えなくても読み込みに成功すれば表示できる', async () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied') })
    renderLazy(async () => ({ default: Loaded }))

    await waitFor(() => expect(screen.getByText('loaded')).toBeTruthy())
  })
})
