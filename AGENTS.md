<!-- subagents:start -->
# 開発フロー（GitHub フロー）とサブエージェントの使い分け

このリポジトリでは GitHub フローに従う。作業内容に応じて以下のサブエージェントに積極的に委任すること。

| エージェント | 使うタイミング |
|---|---|
| test-writer | 作業ブランチで機能追加・バグ修正を実装したあと |
| code-reviewer | pull request を作る前、レビュー依頼された pull request があるとき |
| refactorer | レビューで構造の問題を指摘されたとき、明示的にリファクタを頼まれたとき |
| doc-writer | ドキュメントの更新が必要なとき、pull request の本文を用意するとき |

## 絶対に守ること

- 既定のブランチ（main など）に直接コミット・プッシュしない
- force push、rebase、amend などプッシュ済みの履歴を書き換える操作は、ユーザーの確認なしに行わない
- pull request のマージは行わない。マージは承認後にユーザーが判断する
- `git add .` / `git add -A` は使わず、コミットするファイルを明示的に指定する

## 1. ブランチを作成する

1. 既定のブランチ名を `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` で調べる
2. 既定のブランチに切り替えて最新を取得する（`git switch <既定のブランチ>` → `git pull`）
3. 短く分かりやすい名前でブランチを作成する（例: `increase-test-timeout`、`add-code-of-conduct`）
4. 関連のない変更は、それぞれ別のブランチにする。作業中に無関係な修正が必要だと分かったら、混ぜずにユーザーに別ブランチを提案する

## 2. 変更を加える

1. 実装する
2. 各コミットは分離された完全な変更にする（例: 変数名の変更とテストの追加は別のコミット）
3. コミットメッセージは変更内容が分かるように書く。既存の履歴の書き方に合わせ、慣習が無ければ `fix typo`、`increase rate limit` のように短く書く
4. コミットしたら作業ブランチをプッシュする（初回は `git push -u origin <ブランチ名>`）
5. test-writer でテストを追加する → プッシュ
6. code-reviewer でブランチ全体をレビューする
7. 🔴 の指摘は修正してコミット・プッシュし、再度 code-reviewer に回す
8. 構造的な問題が指摘されたら refactorer に回す（テストが通っている状態で）→ プッシュ
9. doc-writer でドキュメントを更新する → プッシュ

## 3. pull request を作成する

1. doc-writer に pull request の本文を作成させる（変更の概要、解決する問題、関連 issue へのリンク）
2. `gh pr create --base <既定のブランチ> --title "<タイトル>" --body "<本文>"` で作成する
   - まだ作業途中で早めにフィードバックが欲しい場合は `--draft` を付ける
   - 関連する issue があれば本文に `Closes #番号` を入れる
3. `gh pr checks` でチェックの結果を確認し、失敗していれば原因を調べて修正する
4. 作成した pull request の URL をユーザーに伝える

## 4. レビューコメントに対処する

1. ユーザーに頼まれたら `gh pr view <番号> --comments` でレビューコメントを確認する
2. 指摘に対応する変更を、指摘ごとに分かりやすいコミットにしてプッシュする（pull request は自動で更新される）
3. 対応内容をユーザーに要約して伝える。方針に迷う指摘は勝手に判断せず確認する

## 5. pull request をマージする

- マージはユーザーが行う。Codex はマージしない
- `gh pr view` で競合が出ている場合は、ユーザーに伝えて解決方法を確認してから作業ブランチ上で解決する

## 6. ブランチを削除する

ユーザーからマージ完了を伝えられたら:

1. `git switch <既定のブランチ>` → `git pull`
2. `git branch -d <ブランチ名>` でローカルのブランチを削除する（-D での強制削除はしない）
3. リモートにブランチが残っていれば、ユーザーに確認してから `git push origin --delete <ブランチ名>` で削除する

## 省略してよい場合

typo 修正や1行の変更などの小さな修正では、サブエージェントへの委任は省略してよい。ただしブランチの作成と pull request の作成は省略しない。
<!-- subagents:end -->


# このリポジトリでの補足

## レビューのループ

2 の 6〜8 は、次のループとして回す。

1. 実装とテストが揃ったブランチを code-reviewer に回す
2. 🔴 があれば修正をコミットし、もう一度 code-reviewer に回す。🔴 が 0 になるまで繰り返す
3. 同じ指摘が 3 周しても解消しない、または方針の判断が必要な指摘が出たら、ループを止めてユーザーに確認する
4. その場で対応しない 🟡 / 🟢 や、使用量などの理由で続けられない作業は、ラベルを付けた issue にして残す
5. 🔴 が 0 になったら、doc-writer でドキュメントと pull request の本文を用意して pull request を作る

## 構成とコマンド

- `frontend/`: React + Vite + TypeScript。`backend/`: FastAPI + SQLAlchemy（SQLite）。ゲーム仕様は `docs/course-spec.md`
- コミットメッセージは既存の履歴に合わせて `feat(frontend): ...`、`fix: ...`、`test: ...`、`docs: ...` の形式で、説明は日本語で書く
- frontend（`frontend/` で実行）
  - `npm run lint` / `npm run build`
  - `npm test`: Vitest の単体・結合テスト（`tests/unit`、`tests/integration`）
  - `npm run test:e2e`: Playwright の E2E テスト（`e2e/`）。backend（シード済みの一時 SQLite）と本番ビルドを自動で起動する
- backend（`backend/` で実行）: `python -m pytest`（ローカルでは `.venv/Scripts/python -m pytest`）
- CI（`.github/workflows/ci.yml`）が pull request ごとに lint・build・各テストを実行する
- ブランチを積み重ねている場合、レビューやドキュメントの対象は `git diff <親ブランチ>...<ブランチ>` の差分にする
