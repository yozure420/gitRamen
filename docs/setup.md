# 起動手順と環境変数

## AUTH_SECRET_KEY（必須）

backend が JWT の署名に使う鍵。既定値はなく、次のいずれかだと backend は起動時に止まる。

- 未設定、または空
- 過去にリポジトリへ載っていた旧既定値 `dev-secret-key-change-in-production`
- 32 文字未満

### 鍵の生成と設定（docker compose）

1. `.env.example` をリポジトリ直下の `.env` にコピーする（`.env` は git に入れない）
2. 次のコマンドで鍵を生成し、`.env` の `AUTH_SECRET_KEY=` に貼る

```
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

3. `make up`（本番構成）または `make prod-up`（Cloudflare Tunnel 付き。`TUNNEL_TOKEN` も `.env` に必要）で起動する

`.env` を使わず、シェルの環境変数 `AUTH_SECRET_KEY` で渡してもよい。
`docker-compose.yml` では鍵を必須にしていないため、鍵が未設定でも `make down` や `make logs` は使える（`up` した backend が止まる）。

### 開発用の構成

`docker-compose.dev.yml`（`make dev-up`）は、`AUTH_SECRET_KEY` が未設定なら開発専用の鍵を使う。この鍵はリポジトリに載っている公開値なので、外部からアクセスできる環境では使わず、`.env` で別の鍵を渡すこと。

### uvicorn を直接動かす場合

compose を使わず `backend/` で `uvicorn app:app` を起動するときも `AUTH_SECRET_KEY` が必要。環境変数で渡すか、`backend/.env` に `AUTH_SECRET_KEY=...` と書く。pytest は `tests/conftest.py` がテスト用の鍵を設定するので不要。

### 鍵を変えるとき

鍵を変えると、発行済みの JWT はすべて無効になり、全ユーザーが再ログインになる。
