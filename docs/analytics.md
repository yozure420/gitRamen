# GA4 計測

## 取得する内容

- GA4 標準のページ表示数、ユーザー数、セッション数
- `game_start` / `game_over` イベントとコース番号

ログイン名、パスワード、入力したGitコマンド、スコアはGA4へ送りません。測定IDが未設定ならタグを読み込まず、計測もしません。

## セットアップ

1. Google AnalyticsでGitRamen用のGA4プロパティとウェブデータストリーム（`gitramen.com`）を作成します。
2. ストリーム詳細にある `G-...` の測定IDを、デプロイ環境の `VITE_GA_MEASUREMENT_ID` に設定します。これはフロントエンドのビルド時に使われます。
3. GA4の「データストリーム」→対象ストリーム→「拡張計測機能」→「ページビュー」→詳細設定を開き、「ブラウザの履歴イベントに基づくページの変更」をオフにします。アプリ側で画面遷移をページビューとして送るため、二重計測を避ける設定です。
4. フロントエンドを再ビルド・再起動します。GA4のリアルタイムレポートでページビューと `game_start` / `game_over` が届くことを確認します。

Docker Composeでは、`.env` に次の行を追加し、フロントエンドをビルドし直します。

```dotenv
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## セキュリティヘッダー

`nginx.conf` の Content Security Policy で、GA4タグの読み込み先と計測イベントの送信先を許可する必要があります。このリポジトリでは、Google公式の広告機能を使わない構成に沿って必要なGoogleドメインだけを許可しています。別のプロキシやホスティングを使う場合も、その環境のCSPに同等の許可を追加してください。

## メンバーへの共有

GA4の「管理」→アカウントまたはプロパティの「アクセス管理」から、メンバーのGoogleアカウントを追加します。集計閲覧だけならプロパティ単位の「閲覧者」権限で足ります。アカウント全体ではなくGitRamenのプロパティだけに付与してください。

Googleの公式手順: [GA4プロパティの設定](https://support.google.com/analytics/answer/14183469) / [ユーザーの追加と権限](https://support.google.com/analytics/answer/9305788) / [SPAのページビュー計測](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
