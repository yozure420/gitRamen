# Database Setup

このディレクトリにはGitRamenゲームのSQLiteデータベースが格納されます。

## テーブル構成

### game_sessions
ゲームセッション情報を管理
- id: セッションID
- player_name: プレイヤー名
- started_at: 開始時刻
- ended_at: 終了時刻
- score: スコア
- level: 到達レベル
- is_completed: 完了フラグ

### command_history
入力されたコマンドの履歴
- id: 履歴ID
- session_id: セッションID（外部キー）
- command: 入力されたコマンド
- is_correct: 正解かどうか
- executed_at: 実行時刻
- lane: レーン番号

### leaderboard
スコアランキング
- id: エントリID
- player_name: プレイヤー名
- score: スコア
- level_reached: 到達レベル
- created_at: 記録日時

## 初期化方法

### 方法1: FastAPIアプリ起動時に自動作成
```bash
cd backend
uvicorn app:app --reload
```
アプリ起動時に自動的にテーブルが作成されます。

### 方法2: 手動初期化スクリプト
```bash
cd backend
python -m db.init_db
```
