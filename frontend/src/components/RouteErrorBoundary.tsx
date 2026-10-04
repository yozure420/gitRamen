import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

/** ルートの読み込みや描画で例外が出ても、画面全体が真っ白にならないようにする */
class RouteErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="app-loading" role="alert">
        <p>画面を読み込めませんでした。</p>
        <button type="button" onClick={() => window.location.reload()}>再読み込み</button>
      </div>
    )
  }
}

export default RouteErrorBoundary
