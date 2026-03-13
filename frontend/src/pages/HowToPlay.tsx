import '../css/HowToPlay.css'

interface HowToPlayProps {
    onBack: () => void
}

function HowToPlay({onBack}: HowToPlayProps) {
    return (
        <div className="howto-container">
            <header className="howto-header">
                <h1>遊び方</h1>
            </header>

            <div className="howto-body">
                <section className="howto-section">
                    <h2 className="howto-section-title">ゲームの流れ</h2>
                    <div className="howto-step">
                        <span className="howto-step-num">1</span>
                        <p className="howto-step-text">麵の量（難易度）を選んでゲームスタート</p>
                    </div>

                    <div className="howto-step">
                        <span className="howto-step-num">2</span>
                        <p className="howto-step-text">画面の左上に表示される命令を読む</p>
                    </div>
                    <div className="howto-step">
                        <span className="howto-step-num">3</span>
                        <p className="howto-step-text">対応する Git コマンドを入力して Enter</p>
                    </div>
                    <div className="howto-step">
                        <span className="howto-step-num">4</span>
                        <p className="howto-step-text">正解するとスコアアップ！間違えるとミス履歴に記録</p>
                    </div>
                </section>

                <section className="howto-section">
                    <h2 className="howto-section-title">コマンド例</h2>
                    <div className="howto-cmd-list">
                        <div className="howto-cmd-row">
                            <code className="howto-cmd">git add</code>
                            <span className="howto-cmd-desc">変更をステージングエリアに追加</span>
                        </div>
                        <div className="howto-cmd-row">
                            <code className="howto-cmd">git commit</code>
                            <span className="howto-cmd-desc">変更を記録する</span>
                        </div>
                        <div className="howto-cmd-row">
                            <code className="howto-cmd">git push</code>
                            <span className="howto-cmd-desc">リモートリポジトリに反映する</span>
                        </div>
                        <div className="howto-cmd-row">
                            <code className="howto-cmd">git pull</code>
                            <span className="howto-cmd-desc">リモートリポジトリの変更を取得する</span>
                        </div>
                        <div className="howto-cmd-row">
                            <code className="howto-cmd">git revert</code>
                            <span className="howto-cmd-desc">コミットを打ち消す</span>
                        </div>
                        <div className="howto-cmd-row">
                            <code className="howto-cmd">git reset</code>
                            <span className="howto-cmd-desc">コミットを取り消す</span>
                        </div>
                    </div>
                </section>

                <section className="howto-section">
                    <h2 className="howto-section-title">ヒント</h2>
                    <p className="howto-hint">
                    間違えたコマンドはマイページのミス履歴で確認できます。
                    苦手なコマンドを重点的に練習しましょう！
                    </p>
                </section>
            </div>

            <div className="howto-footer">
                <button className="howto-back-btn" onClick={onBack}>
                タイトルに戻る
                </button>
            </div>

        </div>

    )
}

export default HowToPlay
