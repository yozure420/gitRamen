import { useEffect, useRef, useState } from 'react'
import GithubNewsPanel from './GithubNewsPanel'

/** ゲーム画面の「タイトルへ戻る」と左右対称の右側に置く、更新情報のプルダウン */
function GithubNewsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 開いている間だけ、外側のクリックで閉じる
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  return (
    <div className="news-dropdown" ref={containerRef}>
      <button
        type="button"
        className="title-back-btn news-dropdown-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
      >
        更新情報 {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && <GithubNewsPanel />}
    </div>
  )
}

export default GithubNewsDropdown
