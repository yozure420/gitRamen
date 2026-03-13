"""
初期データ投入スクリプト
Gitコマンドのマスターデータをgitramen.dbに投入します
"""
import sys
from pathlib import Path

# バックエンドのルートディレクトリをPythonパスに追加
sys.path.insert(0, str(Path(__file__).parent))

from database import SessionLocal, Base, engine
from models import Cmd, User, History, Miss  # noqa: F401 – 全モデルをロードして metadata を確定させる

# テーブル作成
Base.metadata.create_all(bind=engine)

# 🟢 初級レベル（course=1）
beginner_commands = [
    ("git init", "—", "ローカルに新しいGitリポジトリを作成する"),
    ("git clone", "<URL>", "リモートリポジトリをローカルにコピーする"),
    ("git status", "—", "現在の変更状態を確認する"),
    ("git add", "<file>", "指定ファイルをステージングエリアに追加する"),
    ("git add", ".", "全変更ファイルをステージングに追加する"),
    ("git commit", '-m "message"', "ステージした変更をメッセージ付きでコミットする"),
    ("git push", "origin main", "ローカルのコミットをリモートへ送信する"),
    ("git pull", "—", "リモートの最新変更をローカルに取得＆統合する"),
    ("git log", "—", "コミット履歴を一覧表示する"),
    ("git log", "--oneline", "コミット履歴を1行ずつ簡潔に表示する"),
    ("git branch", "—", "ブランチの一覧を表示する"),
    ("git branch", "<name>", "新しいブランチを作成する"),
    ("git checkout", "<branch>", "指定ブランチに切り替える"),
    ("git checkout", "-b <branch>", "ブランチを作成して即座に切り替える"),
    ("git merge", "<branch>", "指定ブランチを現在のブランチに統合する"),
    ("git diff", "—", "ステージ前の変更差分を表示する"),
    ("git rm", "<file>", "ファイルを削除してステージングに反映する"),
    ("git mv", "<old> <new>", "ファイルを移動またはリネームする"),
    ("git config", "--global user.name", "Gitのユーザー名をグローバル設定する"),
    ("git config", "--global user.email", "Gitのメールアドレスをグローバル設定する"),
]

# 🔵 中級レベル（course=2）
intermediate_commands = [
    ("git stash", "—", "作業中の変更を一時退避する"),
    ("git stash pop", "—", "退避した変更を元に戻す"),
    ("git stash list", "—", "退避した変更の一覧を表示する"),
    ("git stash drop", "—", "特定のstashを削除する"),
    ("git rebase", "<branch>", "コミット履歴を別ブランチの先頭に付け替える"),
    ("git rebase", "-i HEAD~N", "直近N件のコミットを対話的に編集する"),
    ("git cherry-pick", "<hash>", "特定のコミットだけを現在のブランチに適用する"),
    ("git reset", "--soft HEAD~1", "直前のコミットを取り消し、変更はステージに残す"),
    ("git reset", "--hard HEAD~1", "直前のコミットを完全に取り消し、変更も消す"),
    ("git revert", "<hash>", "指定コミットを打ち消す新たなコミットを作る"),
    ("git fetch", "origin", "リモートの変更を取得するが、マージはしない"),
    ("git remote", "-v", "リモートリポジトリの一覧とURLを表示する"),
    ("git remote add", "origin <URL>", "リモートリポジトリを追加する"),
    ("git remote set-url", "origin <URL>", "リモートのURLを変更する"),
    ("git tag", "v1.0.0", "指定コミットにタグを付ける"),
    ("git tag", '-a v1.0.0 -m "msg"', "アノテーション付きタグを作成する"),
    ("git push", "--tags", "ローカルのタグをリモートに送信する"),
    ("git branch", "-d <branch>", "マージ済みブランチを削除する"),
    ("git branch", "-D <branch>", "強制的にブランチを削除する"),
    ("git log", "--graph --oneline", "ブランチの分岐をグラフで視覚表示する"),
    ("git log", '--author="name"', "特定の作者のコミットだけ表示する"),
    ("git log", '--since="2 weeks ago"', "指定期間以降のコミットを表示する"),
    ("git shortlog", "-sn", "作者別のコミット数をランキング表示する"),
    ("git show", "<hash>", "特定コミットの変更内容を表示する"),
    ("git blame", "<file>", "ファイルの各行を最後に変更したコミットを表示する"),
    ("git clean", "-fd", "未追跡のファイル・ディレクトリを一掃する"),
    ("git commit", "--amend", "直前のコミットメッセージや内容を修正する"),
    ("git push", "--force-with-lease", "安全な強制プッシュ（他人の変更を上書きしない）"),
]

# 🟠 上級レベル（course=3）
advanced_commands = [
    ("git bisect start", "—", "バグが混入したコミットを二分探索で特定し始める"),
    ("git bisect good", "<hash>", "指定コミットは正常だとマークする"),
    ("git bisect bad", "<hash>", "指定コミットはバグありとマークする"),
    ("git bisect reset", "—", "二分探索を終了して元のブランチに戻る"),
    ("git reflog", "—", "HEADの移動履歴を表示し、消えたコミットを復元できる"),
    ("git worktree add", "<path> <branch>", "同リポジトリを複数ディレクトリで同時チェックアウト"),
    ("git submodule add", "<URL>", "別リポジトリをサブモジュールとして組み込む"),
    ("git submodule update", "--init --recursive", "サブモジュールを再帰的に初期化・更新する"),
    ("git filter-branch", "--tree-filter", "リポジトリ全履歴からファイルや文字列を書き換える"),
    ("git filter-repo", "--path <file>", "特定パスの履歴のみ保持して履歴を刷新する"),
    ("git archive", "--format=zip HEAD", "現在のHEADをZIPファイルとしてエクスポートする"),
    ("git notes add", '-m "memo"', "コミットを変更せずにメモを付け加える"),
    ("git replace", "<old> <new>", "コミットオブジェクトを別のもので置き換える"),
    ("git bundle", "create repo.bundle --all", "リポジトリ全体を1ファイルにパッケージ化する"),
    ("git bundle", "unbundle repo.bundle", "バンドルファイルからリポジトリを復元する"),
    ("git sparse-checkout", "set <dir>", "巨大リポジトリの一部ディレクトリだけをチェックアウト"),
    ("git rerere", "enable", "コンフリクト解決を記録し、次回から自動適用する"),
    ("git gc", "--aggressive", "ガベージコレクションで不要オブジェクトを削除する"),
    ("git fsck", "—", "リポジトリの整合性チェックを行う"),
    ("git count-objects", "-v", "リポジトリのオブジェクト数とサイズを確認する"),
    ("git ls-tree", "HEAD", "指定コミットのディレクトリツリーを表示する"),
    ("git cat-file", "-p <hash>", "Gitオブジェクトの生の内容を表示する"),
    ("git hash-object", "-w <file>", "ファイルをGitオブジェクトとして手動で保存する"),
]

# 💀 誰が使うねん級（course=4）
expert_commands = [
    ("git filter-repo", "--replace-text <file>", "パスワードやシークレットを全履歴から完全抹消する"),
    ("git update-ref", "-d refs/heads/<branch>", "refを直接操作してブランチポインタを強制削除する"),
    ("git symbolic-ref", "HEAD refs/heads/main", "HEADが指すブランチを低レイヤーで直接書き換える"),
    ("git read-tree", "-m -u <hash>", "ツリーオブジェクトをインデックスに直接読み込む"),
    ("git write-tree", "—", "現在のインデックスからツリーオブジェクトを生成する"),
    ("git commit-tree", '<tree> -p <parent> -m', "コミットオブジェクトを低レベルAPIで手動生成する"),
    ("git update-index", "--assume-unchanged <file>", "ファイルを変更されていないとGitに思い込ませる"),
    ("git update-index", "--skip-worktree <file>", "ローカル設定ファイルをpush対象から除外する"),
    ("git pack-refs", "--all", "すべてのrefをpackファイルに圧縮してパフォーマンス向上"),
    ("git send-email", "--to=<email>", "パッチをメールとして直接送信する(Linux開発文化)"),
    ("git format-patch", "-N HEAD~N", "直近Nコミットをパッチファイルとして書き出す"),
    ("git apply", "<patch>", "パッチファイルをワーキングツリーに適用する"),
    ("git am", "<mailbox>", "メールで受け取ったパッチを連続してコミット適用"),
    ("git interpret-trailers", '--trailer "Co-Author"', "コミットメッセージにメタデータ行を付加する"),
    ("git merge-tree", "<base> <A> <B>", "マージ結果をチェックアウトせず仮想的に確認する"),
    ("git diff-tree", "--no-commit-id -r <hash>", "コミット間のツリー差分を低レベルで表示する"),
    ("git rev-parse", "HEAD", "HEADのSHA-1ハッシュを生のバイト列で取得する"),
    ("git rev-list", "--count HEAD", "現在までの総コミット数を数える"),
    ("git verify-pack", "-v .git/objects/pack/*.idx", "packファイルの内部構造を解析して全オブジェクト確認"),
    ("git for-each-ref", "--sort=-committerdate", "全refを指定フォーマットで列挙・スクリプト連携"),
    ("git credential", "approve / reject", "認証情報をキャッシュに手動で登録・削除する"),
    ("git stripspace", "—", "テキストからGit仕様の不要な空白を除去する"),
    ("git check-attr", "<attr> <file>", ".gitattributesの属性値をファイル単位で確認する"),
]


def format_command(cmd: str, option: str) -> str:
    """コマンドとオプションを結合"""
    if option == "—":
        return cmd
    return f"{cmd} {option}"


def seed_database():
    """データベースに初期データを投入"""
    db = SessionLocal()
    
    try:
        # 既存データをクリア
        db.query(Cmd).delete()
        db.commit()
        
        # 初級レベル（course=1）
        for cmd, option, desc in beginner_commands:
            command_text = format_command(cmd, option)
            db.add(Cmd(command=command_text, description=desc, course=1))
        
        # 中級レベル（course=2）
        for cmd, option, desc in intermediate_commands:
            command_text = format_command(cmd, option)
            db.add(Cmd(command=command_text, description=desc, course=2))
        
        # 上級レベル（course=3）
        for cmd, option, desc in advanced_commands:
            command_text = format_command(cmd, option)
            db.add(Cmd(command=command_text, description=desc, course=3))
        
        # 誰が使うねん級（course=4）
        for cmd, option, desc in expert_commands:
            command_text = format_command(cmd, option)
            db.add(Cmd(command=command_text, description=desc, course=4))
        
        db.commit()
        
        # 投入結果を表示
        total = db.query(Cmd).count()
        course1 = db.query(Cmd).filter(Cmd.course == 1).count()
        course2 = db.query(Cmd).filter(Cmd.course == 2).count()
        course3 = db.query(Cmd).filter(Cmd.course == 3).count()
        course4 = db.query(Cmd).filter(Cmd.course == 4).count()
        
        print("=" * 50)
        print("🍜 Gitコマンドデータ投入完了！")
        print("=" * 50)
        print(f"🟢 初級レベル (course=1): {course1}件")
        print(f"🔵 中級レベル (course=2): {course2}件")
        print(f"🟠 上級レベル (course=3): {course3}件")
        print(f"💀 誰が使うねん級 (course=4): {course4}件")
        print(f"📊 合計: {total}件")
        print("=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラー発生: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
