# GitRamen リリースノート
日付: 2026-03-14
対象範囲: `backend/**/*`, `frontend/src/**/*`, `docker-compose*.yml`, `frontend/nginx.conf`, `frontend/vite.config.ts`, `frontend/package.json`, `backend/requirements.txt`, `backend/Dockerfile.*`, `frontend/Dockerfile.*`

## 1. プロダクト概要
GitRamen は、Gitコマンドの学習を「ラーメン調理と配膳」に置き換えたタイピングゲームです。
現在の主軸は「`git pull` で注文開始」「ブランチ=レーン管理」「手順ベースのワークフロー実行」「配達結果の判定と客リアクション」です。

## 2. 実装済み機能の全体像
1. 画面遷移: タイトル、スタート、ゲーム本編、遊び方、設定、マイページ、ログイン、新規登録。
2. コース選択: コマンド入力式で難易度を選ぶ。
3. 注文開始: `git pull` で1件の注文を受けてラーメンが流れ始める。
4. レーン管理: `git branch` / `git checkout` / `git switch` / `git checkout -b` でレーン追加・切替。
5. 調理手順: `steps` ベースで「今打つべきコマンド」を厳密判定。
6. 配達判定: pushタイミングやレーン一致、具材投入有無で成功/失敗分岐。
7. 視覚演出: レーン上のラーメン移動、トッピング画像重ね、客のクレーム吹き出し。
8. 情報表示: `git status` の伝票ウィンドウ、`git log` のレシートモーダル。
9. 音: BGM/効果音/タイプ音/ミス音のON/OFFと試聴。
10. バックエンドAPI: コマンド取得、正誤チェック、認証APIを実装。

## 3. コマンド仕様一覧（命令と動作）
本セクションは「どのコマンドが、どの命令として扱われ、何を起こすか」を実装通りに記載します。

1. `git pull`
命令: 注文受付開始。
動作: アクティブ注文がない時のみ新規ラーメンを生成。注文文を表示して走行開始。
ファイル: `frontend/src/game/handleGameCommand.ts`, `frontend/src/hooks/useGmScreen.ts`, `frontend/src/game/commandLogic.ts`

2. `git add <具材>`
命令: 具材投入。
動作: 現在ステップが `add` のときのみ進行。重複投入は警告。存在しない具材はエラー。
ファイル: `frontend/src/game/handleGameCommand.ts`

3. `git add .`
命令: 全部乗せ。
動作: `availableItems` を一括で `stagedItems` に投入して次ステップへ。
ファイル: `frontend/src/game/handleGameCommand.ts`

4. `git commit -m "..."`
命令: 注文確定（コール）。
動作: 現在ステップが `commit` のとき進行。`isCommitted` を `true` に更新。
ファイル: `frontend/src/game/handleGameCommand.ts`

5. `git push origin main`
命令: 配膳開始。
動作: 実行時に速度を `PUSH_SPEED` に上げる。順番外でも実行は可能。
分岐:
`commit` 前pushは「中身なし」失敗。
`main` 以外レーンからの push は「push先ミス」失敗。
ファイル: `frontend/src/game/handleGameCommand.ts`, `frontend/src/game/gameEngine.ts`

6. `git checkout <branch>` / `git switch <branch>`
命令: 既存レーン切替。
動作: `existingBranches` 内なら常に許可。ステップ一致時は手順進行、非一致時は自由移動としてレーンだけ変更。
ファイル: `frontend/src/game/handleGameCommand.ts`

7. `git checkout -b <branch>`
命令: 新規レーン作成して切替。
動作: 存在しない名前のみ作成可。最大レーン数（3）まで。`existingBranches` と `laneCount` を更新。
ファイル: `frontend/src/game/handleGameCommand.ts`

8. `git branch`
命令: レーン一覧確認。
動作: `existingBranches` を表示。ステップ一致時は手順進行。
ファイル: `frontend/src/game/handleGameCommand.ts`

9. `git branch <name>`
命令: レーン追加。
動作: 未存在名で作成。上限3。状況により手順進行または単体実行。
ファイル: `frontend/src/game/handleGameCommand.ts`

10. `git status`
命令: 厨房状態確認。
動作: 伝票ウィンドウを出し、具材投入状況、commit/push状況を表示。ステップ一致なら進行。
ファイル: `frontend/src/game/handleGameCommand.ts`

11. `git log` / `git log --oneline`
命令: 注文履歴確認。
動作: レシートモーダル表示。`--oneline` は簡易表示モード。ゲームは停止しない。
補足: モーダルは `Enter` で閉じる。
ファイル: `frontend/src/game/handleGameCommand.ts`, `frontend/src/components/gm/GmCenterPanel.tsx`

12. `git help`
命令: ヘルプ表示。
動作: ヘルプパネルの表示切替。表示中は一時停止。再開ボタンで復帰。
ファイル: `frontend/src/game/handleGameCommand.ts`, `frontend/src/components/gm/GmLeftPanel.tsx`

13. `git clone ...`
命令: ゲーム中は使用不可。
動作: 「ゲーム開始前専用」のメッセージを返す。
ファイル: `frontend/src/game/handleGameCommand.ts`

## 4. 注文生成ロジック（ランダム仕様）
1. 通常注文:
ランダムでベースラーメンとトッピングを決定し、`add -> commit` 手順を生成。
2. 来客イベント:
確率で `お客さんいらっしゃいました！！いらっしゃいませ～！` を表示し、必要コマンドを `git branch <name>` にする。
3. レーン依存命令:
対象レーンに応じて最初の手順が変わる。
`lane1`: 直接 `git add ...`
`lane2`: 先に `git status`
`lane3`: 先に `git log --oneline`
ファイル: `frontend/src/game/commandLogic.ts`

## 5. ゲーム状態モデル
`Ramen` に以下を保持。
1. 進行: `steps`, `currentStepIndex`, `expectedInputs`
2. レーン: `currentLane`, `targetLane`
3. 調理状態: `stagedItems`, `isCommitted`, `isPushed`
4. 失敗要因: `pushedToMainFromOtherLane`
5. 移動: `position`, `speed`
ファイル: `frontend/src/types/interface.ts`

## 6. 判定ロジック（成功/失敗）
1. 中身なし push 失敗:
`isPushed && !isCommitted`
2. push先ミス失敗:
`isPushed && pushedToMainFromOtherLane`
3. 手順未完了失敗:
`!isWorkflowCompleted(ramen)`
4. レーン一致成功:
`currentLane === targetLane` かつ必要具材が投入済み
5. 誤配達失敗:
上記以外（別レーンに届いた）
ファイル: `frontend/src/game/gameEngine.ts`

## 7. UI/UX 実装詳細
1. 左パネル:
スコア、残り時間、コース、現在ラーメン一覧、手順進行、具材状況。
`lane-status` は存在ブランチ名を優先表示（例: `unkoレーン`）。
2. 中央パネル:
レーン描画、ラーメン移動、トッピング重ね表示、pushバッジ、客画像、クレーム吹き出し。
`lane-number` もブランチ名表示。
3. ログモーダル:
`git log` で開くレシート風モーダル。`Enter` で閉じる。
4. 右パネル:
必要具材の可視化。追加済みチェック表示。
5. 下部入力:
入力フォーカス維持、タイプ音、結果メッセージ色分け。
ファイル: `frontend/src/components/gm/*.tsx`, `frontend/src/css/GmScreen.css`

## 8. 画面フロー
1. タイトル画面から各画面へ遷移。
2. スタート画面はコマンド入力で難易度決定。
`git clone easy` => 初級
`git clone normal` => 中級
`git init` -> `git remote add high|god` => 上級/超上級
3. 本編は `GmScreen` でフック `useGmScreen` が状態を統括。
ファイル: `frontend/src/App.tsx`, `frontend/src/pages/GmStart.tsx`, `frontend/src/pages/GmScreen.tsx`

## 9. 音とアセット
1. SE:
`type`, `miss`, `se(正解)` を実装。
2. BGM:
`/sounds/game-bgm.mp3` をループ再生。
3. 画像:
注文キーワードからラーメン画像を選択、具材名からトッピング画像を選択。
4. 客画像:
`assets/human` からランダム選択。
ファイル: `frontend/src/lib/Sounds.ts`, `frontend/src/components/gm/GmCenterPanel.tsx`

## 10. フロントエンドAPI実装
1. コマンド取得:
`/api/commands/random`, `/api/commands/course`
2. 除外ID:
`git init`, `git clone`, `git merge <branch>` はゲーム出題から除外。
3. 認証API:
`register`, `login`, `me`, token保存/削除。
ファイル: `frontend/src/api/cmdFetch_1.ts`, `frontend/src/api/auth.ts`

## 11. バックエンド実装
1. FastAPI + SQLAlchemy + SQLite。
2. コマンドAPI:
`GET /api/commands/random`
`GET /api/commands/course`
`GET /api/commands/{command_id}`
`POST /api/commands/check`
3. 認証API:
`POST /auth/register`
`POST /auth/login`
`GET /auth/me`
4. JWT:
署名/検証、期限付きトークン。
5. モデル:
`users`, `command`, `history`, `miss`。
6. seed:
course別コマンドデータ投入、`game_note` カラムの簡易マイグレーション対応。
ファイル: `backend/app.py`, `backend/routers/auth.py`, `backend/auth/*.py`, `backend/models/*.py`, `backend/seed.py`

## 12. 実行・デプロイ構成
1. 開発構成:
`docker-compose.dev.yml` で backend/frontend を起動、SQLite volume永続化。
2. 本番構成:
`docker-compose.yml` で backend(gunicorn) + frontend(nginx)。
3. Vite:
`/api` を backend にプロキシ。
4. Nginx:
SPA fallback + `/api/` reverse proxy。
ファイル: `docker-compose.dev.yml`, `docker-compose.yml`, `frontend/vite.config.ts`, `frontend/nginx.conf`

## 13. 既知の制約
1. レーン上限は3固定。
2. pushコマンドは `git push origin main` のみ判定対象。
3. `useRamenSpawner` は残っているが現行フロー（pull起動）では未使用。
4. マイページは現状モック表示が中心。
5. タイトル画面の「新規登録」ボタンは遷移未接続。
6. `cmdFetch_1.ts` のAPI_BASE_URLが固定値。

## 14. 参照ファイル注記
本ノートは `backend/**/*` と `frontend/src/**/*` のコードを直接参照し、機能単位で整理しています。
画像/音声のバイナリ自体は機能カテゴリとして記述しています。
