/**
 * auth.ts — 認証関連の API 呼び出しをまとめたモジュール
 *
 * バックエンドのエンドポイント（Vite プロキシ経由）:
 *   POST /api/auth/register  → バックエンドの /auth/register
 *   POST /api/auth/login     → バックエンドの /auth/login
 *   GET  /api/auth/me        → バックエンドの /auth/me（要: Bearer Token）
 */

// ---- レスポンスの型定義 --------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/** POST /api/auth/register, GET /api/auth/me の戻り値 */
export interface UserResponse {
  id: string
  name: string
  title: string
  created_at: string
}

/** POST /api/auth/login の戻り値 */
export interface TokenResponse {
  access_token: string
  token_type: string
}

// ---- トークン管理 ---------------------------------------

const TOKEN_KEY = 'access_token'

/** JWT を localStorage に保存する */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** localStorage から JWT を取得する。未ログインなら null */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** ログアウト時など、JWT を削除する */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ---- API 関数 -------------------------------------------

/**
 * 新規登録。成功すると作成されたユーザー情報を返す。
 * 失敗（ユーザー名重複など）は Error をスローするので呼び元で catch する。
 */
export async function registerUser(
  name: string,
  password: string,
): Promise<UserResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // Pydantic バリデーションエラー（422）は detail が配列になるため先頭の msg を取り出す
    const detail = body.detail
    const message = Array.isArray(detail)
      ? (detail[0]?.msg ?? '登録に失敗しました')
      : (detail ?? '登録に失敗しました')
    throw new Error(message)
  }

  return res.json() as Promise<UserResponse>
}

/**
 * ログイン。成功すると JWT アクセストークンを返す。
 * 失敗（ユーザー名・パスワード不一致など）は Error をスローする。
 */
export async function loginUser(
  name: string,
  password: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? 'ログインに失敗しました')
  }

  return res.json() as Promise<TokenResponse>
}

/**
 * 現在のログインユーザー情報を取得する。
 * localStorage のトークンを Authorization ヘッダーに付けて送る。
 * トークンがない・無効な場合は Error をスローする。
 */
export async function fetchCurrentUser(): Promise<UserResponse> {
  const token = getToken()
  if (!token) throw new Error('ログインしていません')

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? 'ユーザー情報の取得に失敗しました')
  }

  return res.json() as Promise<UserResponse>
}
