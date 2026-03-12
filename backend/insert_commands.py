from db.models import SessionLocal, Cmd, init_db

# データベースとテーブルを初期化
init_db()

# コマンドデータ
commands_data = [
    # 🟢 初級レベル — まずはここから (course=1)
    ("git init", "—", "ローカルに新しいGitリポジトリを作成する", 1),
    ("git clone", "<URL>", "リモートリポジトリをローカルにコピーする", 1),
    ("git status", "—", "現在の変更状態を確認する", 1),
    ("git add", "<file>", "指定ファイルをステージングエリアに追加する", 1),
    ("git add", ".", "全変更ファイルをステージングに追加する", 1),
    ("git commit", "-m \"message\"", "ステージした変更をメッセージ付きでコミットする", 1),
    ("git push", "origin main", "ローカルのコミットをリモートへ送信する", 1),
    ("git pull", "—", "リモートの最新変更をローカルに取得＆統合する", 1),
    ("git log", "—", "コミット履歴を一覧表示する", 1),
    ("git log", "--oneline", "コミット履歴を1行ずつ簡潔に表示する", 1),
    ("git branch", "—", "ブランチの一覧を表示する", 1),
    ("git branch", "<name>", "新しいブランチを作成する", 1),
    ("git checkout", "<branch>", "指定ブランチに切り替える", 1),
    ("git checkout", "-b <branch>", "ブランチを作成して即座に切り替える", 1),
    ("git merge", "<branch>", "指定ブランチを現在のブランチに統合する", 1),
    ("git diff", "—", "ステージ前の変更差分を表示する", 1),
    ("git rm", "<file>", "ファイルを削除してステージングに反映する", 1),
    ("git mv", "<old> <new>", "ファイルを移動またはリネームする", 1),
    ("git config", "--global user.name", "Gitのユーザー名をグローバル設定する", 1),
    ("git config", "--global user.email", "Gitのメールアドレスをグローバル設定する", 1),
    
    # 🔵 中級レベル — チーム開発で活躍 (course=2)
    ("git stash", "—", "作業中の変更を一時退避する", 2),
    ("git stash pop", "—", "退避した変更を元に戻す", 2),
    ("git stash list", "—", "退避した変更の一覧を表示する", 2),
    ("git stash drop", "—", "特定のstashを削除する", 2),
    ("git rebase", "<branch>", "コミット履歴を別ブランチの先頭に付け替える", 2),
    ("git rebase", "-i HEAD~N", "直近N件のコミットを対話的に編集する", 2),
    ("git cherry-pick", "<hash>", "特定のコミットだけを現在のブランチに適用する", 2),
    ("git reset", "--soft HEAD~1", "直前のコミットを取り消し、変更はステージに残す", 2),
    ("git reset", "--hard HEAD~1", "直前のコミットを完全に取り消し、変更も消す", 2),
    ("git revert", "<hash>", "指定コミットを打ち消す新たなコミットを作る", 2),
    ("git fetch", "origin", "リモートの変更を取得するが、マージはしない", 2),
    ("git remote", "-v", "リモートリポジトリの一覧とURLを表示する", 2),
    ("git remote add", "origin <URL>", "リモートリポジトリを追加する", 2),
    ("git remote set-url", "origin <URL>", "リモートのURLを変更する", 2),
    ("git tag", "v1.0.0", "指定コミットにタグを付ける", 2),
    ("git tag", "-a v1.0.0 -m \"msg\"", "アノテーション付きタグを作成する", 2),
    ("git push", "--tags", "ローカルのタグをリモートに送信する", 2),
    ("git branch", "-d <branch>", "マージ済みブランチを削除する", 2),
    ("git branch", "-D <branch>", "強制的にブランチを削除する", 2),
    ("git log", "--graph --oneline", "ブランチの分岐をグラフで視覚表示する", 2),
    ("git log", "--author=\"name\"", "特定の作者のコミットだけ表示する", 2),
    ("git log", "--since=\"2 weeks ago\"", "指定期間以降のコミットを表示する", 2),
    ("git shortlog", "-sn", "作者別のコミット数をランキング表示する", 2),
    ("git show", "<hash>", "特定コミットの変更内容を表示する", 2),
    ("git blame", "<file>", "ファイルの各行を最後に変更したコミットを表示する", 2),
    ("git clean", "-fd", "未追跡のファイル・ディレクトリを一掃する", 2),
    ("git commit", "--amend", "直前のコミットメッセージや内容を修正する", 2),
    ("git push", "--force-with-lease", "安全な強制プッシュ（他人の変更を上書きしない）", 2),
    
    # 🟠 上級レベル — 玄人の技 (course=3)
    ("git bisect start", "—", "バグが混入したコミットを二分探索で特定し始める", 3),
    ("git bisect good", "<hash>", "指定コミットは正常だとマークする", 3),
    ("git bisect bad", "<hash>", "指定コミットはバグありとマークする", 3),
    ("git bisect reset", "—", "二分探索を終了して元のブランチに戻る", 3),
    ("git reflog", "—", "HEADの移動履歴を表示し、消えたコミットを復元できる", 3),
    ("git worktree add", "<path> <branch>", "同リポジトリを複数ディレクトリで同時チェックアウト", 3),
    ("git submodule add", "<URL>", "別リポジトリをサブモジュールとして組み込む", 3),
    ("git submodule update", "--init --recursive", "サブモジュールを再帰的に初期化・更新する", 3),
    ("git filter-branch", "--tree-filter", "リポジトリ全履歴からファイルや文字列を書き換える", 3),
    ("git filter-repo", "--path <file>", "特定パスの履歴のみ保持して履歴を刷新する", 3),
    ("git archive", "--format=zip HEAD", "現在のHEADをZIPファイルとしてエクスポートする", 3),
    ("git notes add", "-m \"memo\"", "コミットを変更せずにメモを付け加える", 3),
    ("git replace", "<old> <new>", "コミットオブジェクトを別のもので置き換える", 3),
    ("git bundle", "create repo.bundle --all", "リポジトリ全体を1ファイルにパッケージ化する", 3),
    ("git bundle", "unbundle repo.bundle", "バンドルファイルからリポジトリを復元する", 3),
    ("git sparse-checkout", "set <dir>", "巨大リポジトリの一部ディレクトリだけをチェックアウト", 3),
    ("git rerere", "enable", "コンフリクト解決を記録し、次回から自動適用する", 3),
    ("git gc", "--aggressive", "ガベージコレクションで不要オブジェクトを削除する", 3),
    ("git fsck", "—", "リポジトリの整合性チェックを行う", 3),
    ("git count-objects", "-v", "リポジトリのオブジェクト数とサイズを確認する", 3),
    ("git ls-tree", "HEAD", "指定コミットのディレクトリツリーを表示する", 3),
    ("git cat-file", "-p <hash>", "Gitオブジェクトの生の内容を表示する", 3),
    ("git hash-object", "-w <file>", "ファイルをGitオブジェクトとして手動で保存する", 3),
    
    # 💀 誰が使うねん級 — 伝説の呪文 (course=4)
    ("git filter-repo", "--replace-text <file>", "パスワードやシークレットを全履歴から完全抹消する", 4),
    ("git update-ref", "-d refs/heads/<branch>", "refを直接操作してブランチポインタを強制削除する", 4),
    ("git symbolic-ref", "HEAD refs/heads/main", "HEADが指すブランチを低レイヤーで直接書き換える", 4),
    ("git read-tree", "-m -u <hash>", "ツリーオブジェクトをインデックスに直接読み込む", 4),
    ("git write-tree", "—", "現在のインデックスからツリーオブジェクトを生成する", 4),
    ("git commit-tree", "<tree> -p <parent> -m", "コミットオブジェクトを低レベルAPIで手動生成する", 4),
    ("git update-index", "--assume-unchanged <file>", "ファイルを変更されていないとGitに思い込ませる", 4),
    ("git update-index", "--skip-worktree <file>", "ローカル設定ファイルをpush対象から除外する", 4),
    ("git pack-refs", "--all", "すべてのrefをpackファイルに圧縮してパフォーマンス向上", 4),
    ("git send-email", "--to=<email>", "パッチをメールとして直接送信する(Linux開発文化)", 4),
    ("git format-patch", "-N HEAD~N", "直近Nコミットをパッチファイルとして書き出す", 4),
    ("git apply", "<patch>", "パッチファイルをワーキングツリーに適用する", 4),
    ("git am", "<mailbox>", "メールで受け取ったパッチを連続してコミット適用", 4),
    ("git interpret-trailers", "--trailer \"Co-Author\"", "コミットメッセージにメタデータ行を付加する", 4),
    ("git merge-tree", "<base> <A> <B>", "マージ結果をチェックアウトせず仮想的に確認する", 4),
    ("git diff-tree", "--no-commit-id -r <hash>", "コミット間のツリー差分を低レベルで表示する", 4),
    ("git rev-parse", "HEAD", "HEADのSHA-1ハッシュを生のバイト列で取得する", 4),
    ("git rev-list", "--count HEAD", "現在までの総コミット数を数える", 4),
    ("git verify-pack", "-v .git/objects/pack/*.idx", "packファイルの内部構造を解析して全オブジェクト確認", 4),
    ("git for-each-ref", "--sort=-committerdate", "全refを指定フォーマットで列挙・スクリプト連携", 4),
    ("git credential", "approve / reject", "認証情報をキャッシュに手動で登録・削除する", 4),
    ("git stripspace", "—", "テキストからGit仕様の不要な空白を除去する", 4),
    ("git check-attr", "<attr> <file>", ".gitattributesの属性値をファイル単位で確認する", 4),
]

def insert_commands():
    db = SessionLocal()
    try:
        # 既存のコマンドを削除（重複を避けるため）
        db.query(Cmd).delete()
        db.commit()
        
        # データを挿入
        for cmd_name, options, desc, level in commands_data:
            # コマンドとオプションを結合
            if options == "—":
                full_command = cmd_name
            else:
                full_command = f"{cmd_name} {options}"
            
            cmd = Cmd(
                command=full_command,
                description=desc,
                course=level
            )
            db.add(cmd)
        
        db.commit()
        print(f"✅ {len(commands_data)}件のコマンドを挿入しました！")
        
        # 確認のため件数を表示
        counts = {}
        for level in [1, 2, 3, 4]:
            count = db.query(Cmd).filter(Cmd.course == level).count()
            counts[level] = count
        
        print(f"\n📊 レベル別コマンド数:")
        print(f"  🟢 初級 (course=1): {counts[1]}件")
        print(f"  🔵 中級 (course=2): {counts[2]}件")
        print(f"  🟠 上級 (course=3): {counts[3]}件")
        print(f"  💀 誰が使うねん級 (course=4): {counts[4]}件")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    insert_commands()
