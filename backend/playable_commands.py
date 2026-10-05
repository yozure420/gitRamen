"""ゲーム内で実際に操作できる（ヘルプ・出題に出す）コマンドの一覧

シード（seed.py）と簡易マイグレーション（migrations.py）の両方から参照する。
"""

# コース番号 → コマンドの表記。ここにないものは playable=False になる
PLAYABLE_COMMANDS = {
    1: {
        "git status", "git add <file>", "git add .", 'git commit -m "message"', "git push origin main",
        "git pull", "git log", "git log --oneline", "git branch", "git branch <name>",
        "git checkout <branch>", "git checkout -b <branch>",
    },
    2: {"git stash", "git stash pop", "git stash list", "git reset --soft HEAD~1", "git commit --amend"},
    3: {"git bisect start", "git bisect good <hash>", "git bisect bad", "git bisect reset", "git reflog", "git reset --hard HEAD@{1}"},
    4: {"git write-tree", "git commit-tree <tree> -p <parent> -m", "git update-ref refs/heads/<branch> <hash>"},
}
