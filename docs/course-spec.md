# GitRamen コース仕様

全コース共通のコアループ（`git pull` で注文 → レーン移動 → `add` → `commit` → `push`）を維持し、
上位コースほど「厨房ギミック」として実際の Git の使い所を学ぶ手順が注文に仕込まれる（ハイブリッド方針 / #41）。

## コース一覧

| コース | 開始コマンド | course | 流速 | スコア倍率 | 追加ギミック |
| --- | --- | --- | --- | --- | --- |
| 初級 | `git clone easy` | 1 | 0.12 | ×1 | なし（通常注文・来客のみ） |
| 中級 | `git clone normal` | 2 | 0.12 | ×2 | stash / reset --soft / amend |
| 上級 | `git init` → `git remote add high` | 3 | 0.10 | ×3 | 中級 + reflog / bisect |
| 超上級 | `git init` → `git remote add god` | 4 | 0.09 | ×4 | 上級 + plumbing |

- 来客イベント（`git branch <name>` → `git checkout <name>`）は全コースで、レーンに空きがあるとき 35% で発生する。
- 来客以外の注文は、下表の確率でギミックが選ばれ、残りは通常注文になる（`ORDER_EVENT_RATES`）。

| ギミック | 中級 | 上級 | 超上級 |
| --- | --- | --- | --- |
| stash | 20% | 12% | 8% |
| reset_soft | 20% | 12% | 8% |
| amend | 20% | 12% | 8% |
| reflog | – | 20% | 12% |
| bisect | – | 20% | 12% |
| plumbing | – | – | 30% |

## ギミック仕様

各ギミックは「伝票（注文パネル）」に手順として表示される。手順に入った瞬間にイベント告知（伝票ウィンドウ）が出て、ゲームは一時停止する（Enter / Esc で再開）。

### 中級

#### stash: 常連さんの割り込み（#42）
1. `git add <具材A>`
2. `git stash` … 作りかけを退避（`stagedItems` → `stashedItems`、`isStashed=true`）
3. `git add <具材B>` → `git commit -m "常連さんの…"` … 割り込み分を先に確定
4. `git stash pop` … 退避分を戻す（`stagedItems` に合流、`isCommitted=false`）
5. `git commit -m "<本来のコール>"` → `git push`

ミス: 退避していないのに `stash pop` / 具材なしで `stash` / 二重 `stash`。`stash pop` を忘れて push すると到着時に「手順未完了」で失敗。
`git stash list` は手順外でも使える確認コマンド（ミスにならない）。

#### reset_soft: コール間違い（#42）
1. `git add <具材>` → `git commit -m "<間違ったコール>"`
2. `git reset --soft HEAD~1`（`HEAD^` も可）… `isCommitted=false`、具材は残る
3. `git commit -m "<正しいコール>"` → `git push`

ミス: 未コミット状態での reset。

#### amend: 注文変更（#51）
1. `git add <具材A>` → `git commit -m "<コール>"`
2. 告知「やっぱり<具材B>も追加で！」→ `git add <具材B>`
3. `git commit --amend`（`--no-edit` / `-m "..."` 付きも可）→ `git push`

ミス: amend の手順で普通の `git commit -m` を打つ（別の丼になる）。amend を忘れて push すると「手順未完了」で失敗。

### 上級

#### reflog: 丼が消えた！
1. `git add` → `git commit`
2. `git reflog` の手順に入った瞬間、新人の `reset --hard` で丼が消える（`onEnter: drop_bowl` / `isLost=true`、具材は `lostItems` へ、`isCommitted=false`）
3. `git reflog` … `HEAD@{1}` に消える前のコミットがあることを確認
4. `git reset --hard HEAD@{1}` … 丼を復元（`isCommitted=true`）→ `git push`

ミス: reflog より先に復元コマンド。消えたまま push すると「空振りプッシュ」で失敗。
`git reflog` は手順外でも使える確認コマンド（ミスにならない）。

#### bisect: スープがまずい！
`git bisect start` → `git bisect bad`（`HEAD` 付きも可）→ `git bisect good <表示されたハッシュ>` → `git bisect reset`（犯人ハッシュを告知）→ `git add` → `git commit` → `git push`

ミス: 手順違い・ハッシュ違い。

### 超上級

#### plumbing: 親方の検品
1. `git add <具材>`
2. `git write-tree` … 告知でツリーハッシュ・コミットハッシュを提示
3. `git commit-tree <tree> -p HEAD -m "..."` … メッセージは自由、ツリーと親は厳密に照合
4. `git update-ref refs/heads/<ブランチ> <commit>` … ここで `isCommitted=true`
5. `git push`

ミス: 普通の `git commit`、ツリー / 親の指定違い、貼り先ブランチ・コミット違い。

## 配達判定（到着時）
1. push 済みかつ未コミット → 空振りプッシュ（-70×course）
2. 別レーンから main へ push → push先ミス（-60×course）
3. 手順が残っている → 手順未完了（-50）
4. 同じレーンで、全 add 手順の具材が乗っている → 成功（+100×course）／欠けていれば味判定失敗（-30×course）
5. それ以外 → 誤配達（-50）

来客注文のお客さんは、開設したレーンで待っている。

## ヘルプとシードデータ（#45 / #55）
- `command.playable` が `true` のコマンドだけがヘルプ・出題の対象。ゲーム中のヘルプは course 1〜現在コースの playable コマンドを連結して表示する。
- 実装済みコマンドは `backend/playable_commands.py` の `PLAYABLE_COMMANDS` で管理する。
- 既存 DB は起動時の簡易マイグレーションで `playable` 列が追加される（列を追加するときに、`PLAYABLE_COMMANDS` にないコマンドを `playable=false` にする）。本番反映時は `docker compose exec backend python seed.py` で再シードすること。

## スコープ外
rebase / cherry-pick / revert / worktree / submodule などは未実装（`playable=false`）。ヘルプ・出題には出ない。
