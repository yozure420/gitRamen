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
                        <p className="howto-step-text">画面に表示される命令（オーダー）を読む</p>
                    </div>
                    <div className="howto-step">
                        <span className="howto-step-num">3</span>
                        <p className="howto-step-text">対応する Git コマンドを入力して Enter</p>
                    </div>
                    <div className="howto-step">
                        <span className="howto-step-num">4</span>
                        <p className="howto-step-text">正解するとスコアアップ！間違えるとスコアダウン</p>
                    </div>
                </section>

                <section className="howto-section">
                    <h2 className="howto-section-title">代表的なコマンド例</h2>
                    <div className="howto-cmd-list">
                        <div className="howto-cmd-row">
                            <div className="howto-cmd-name"><code className="howto-cmd">git pull</code></div>
                            <div className="howto-cmd-desc">新しい注文を受け取る</div>
                        </div>
                        <div className="howto-cmd-row">
                            <div className="howto-cmd-name"><code className="howto-cmd">git checkout [ブランチ名]</code></div>
                            <div className="howto-cmd-desc">指定されたレーンに移動する</div>
                        </div>
                        <div className="howto-cmd-row">
                            <div className="howto-cmd-name"><code className="howto-cmd">git add [具材名]</code></div>
                            <div className="howto-cmd-desc">トッピングを追加する（. で全マシ）</div>
                        </div>
                        <div className="howto-cmd-row">
                            <div className="howto-cmd-name"><code className="howto-cmd">git commit -m "..."</code></div>
                            <div className="howto-cmd-desc">調理内容を確定する</div>
                        </div>
                        <div className="howto-cmd-row">
                            <div className="howto-cmd-name"><code className="howto-cmd">git push origin [ブランチ名]</code></div>
                            <div className="howto-cmd-desc">完成したラーメンを配膳する</div>
                        </div>
                        <div className="howto-cmd-row">
                            <div className="howto-cmd-name"><code className="howto-cmd">git status</code></div>
                            <div className="howto-cmd-desc">現在のどんぶりの状況（伝票）を確認する</div>
                        </div>
                        <div className="howto-cmd-row">
                            <div className="howto-cmd-name"><code className="howto-cmd">git log</code></div>
                            <div className="howto-cmd-desc">これまでのコミット履歴（レシート）を確認する</div>
                        </div>
                    </div>
                </section>

                <section className="howto-section">
                    <h2 className="howto-section-title">ヒント</h2>
                    <p className="howto-hint">
                        操作に迷った時は、入力欄に <strong>git help</strong> を入力するとコマンド一覧を確認できます。
                    </p>
                    <p className="howto-hint" style={{ marginTop: '12px' }}>
                        <strong>git status</strong> や <strong>git log</strong> を開いている間は、制限時間やラーメンの移動が一時停止します。確認後は <strong>Enterキー</strong> または <strong>Escapeキー</strong> でゲームに戻れます。
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