"""Git / GitHub の更新情報と GitHub の稼働状況を取得する。

外部 API へのアクセスはレート制限があるため、取得結果は TTL 付きでキャッシュする。
パース処理は純粋関数に分けてテストしやすくしている。
"""
from __future__ import annotations

import asyncio
import os
import re
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Callable, Optional

import httpx

GIT_TAGS_URL = "https://api.github.com/repos/git/git/tags?per_page=100"
GITHUB_CHANGELOG_URL = "https://github.blog/changelog/feed/"
GITRAMEN_COMMITS_URL = "https://api.github.com/repos/yozure420/gitRamen/commits?per_page=10"
GITHUB_STATUS_URL = "https://www.githubstatus.com/api/v2/summary.json"

# githubstatus.com のコンポーネントのうち、ゲームの利用者に関係が深いもの
WATCHED_COMPONENTS = ("Git Operations", "API Requests", "Webhooks", "Issues", "Pull Requests", "Actions")

REQUEST_TIMEOUT_SECONDS = 5.0
CACHE_TTL_SECONDS = 600
# 取得に失敗したソースがある結果は短く持つ（一時的な障害を10分間見せ続けない）
FAILED_CACHE_TTL_SECONDS = 60
ITEM_LIMIT = 5

GIT_RELEASE_TAG = re.compile(r"^v(\d+)\.(\d+)(?:\.(\d+))?$")


@dataclass(frozen=True)
class NewsItem:
    source: str  # 'git' | 'github' | 'gitramen'
    title: str
    url: str
    published_at: Optional[str]  # ISO8601 / 取得できなければ None

    def as_dict(self) -> dict[str, Any]:
        return {"source": self.source, "title": self.title, "url": self.url, "published_at": self.published_at}


class TtlCache:
    """単純な TTL キャッシュ。テストから時計を差し替えられるようにしている。"""

    def __init__(self, ttl_seconds: float = CACHE_TTL_SECONDS, clock: Callable[[], float] = time.monotonic):
        self._ttl = ttl_seconds
        self._clock = clock
        self._entries: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._entries.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if self._clock() >= expires_at:
            del self._entries[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:
        ttl = self._ttl if ttl_seconds is None else ttl_seconds
        self._entries[key] = (self._clock() + ttl, value)

    def clear(self) -> None:
        self._entries.clear()


cache = TtlCache()


# --- パース（純粋関数） ---------------------------------------------------

def _to_iso(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat()
    except ValueError:
        pass
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def parse_git_tags(payload: Any, limit: int = ITEM_LIMIT) -> list[NewsItem]:
    """git/git のタグから正式リリース（v2.51.0 など）だけを新しい順に取り出す。"""
    if not isinstance(payload, list):
        return []

    releases: list[tuple[tuple[int, int, int], str]] = []
    for tag in payload:
        name = tag.get("name") if isinstance(tag, dict) else None
        if not isinstance(name, str):
            continue
        matched = GIT_RELEASE_TAG.match(name)
        if not matched:  # -rc1 などは除外
            continue
        major, minor, patch = matched.groups()
        releases.append(((int(major), int(minor), int(patch or 0)), name))

    releases.sort(key=lambda item: item[0], reverse=True)
    return [
        NewsItem(
            source="git",
            title=f"Git {name.lstrip('v')} がリリースされました",
            url=f"https://github.com/git/git/releases/tag/{name}",
            published_at=None,  # タグ API には日付が含まれない
        )
        for _, name in releases[:limit]
    ]


def parse_changelog_feed(feed_text: str, limit: int = ITEM_LIMIT) -> list[NewsItem]:
    """GitHub Changelog の RSS から新着エントリを取り出す。"""
    try:
        root = ET.fromstring(feed_text)
    except ET.ParseError:
        return []

    items: list[NewsItem] = []
    for entry in root.iterfind(".//item"):
        title = (entry.findtext("title") or "").strip()
        link = (entry.findtext("link") or "").strip()
        if not title or not link:
            continue
        items.append(NewsItem(
            source="github",
            title=title,
            url=link,
            published_at=_to_iso(entry.findtext("pubDate")),
        ))
        if len(items) >= limit:
            break
    return items


def parse_repo_commits(payload: Any, limit: int = ITEM_LIMIT) -> list[NewsItem]:
    """GitRamen リポジトリのコミット一覧を取り出す（メッセージは1行目のみ）。"""
    if not isinstance(payload, list):
        return []

    items: list[NewsItem] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        commit = row.get("commit") or {}
        message = (commit.get("message") or "").strip().splitlines()
        if not message:
            continue
        items.append(NewsItem(
            source="gitramen",
            title=message[0],
            url=row.get("html_url") or "https://github.com/yozure420/gitRamen",
            published_at=_to_iso((commit.get("author") or {}).get("date")),
        ))
        if len(items) >= limit:
            break
    return items


def parse_github_status(payload: Any) -> Optional[dict[str, Any]]:
    """githubstatus.com のサマリから、全体状況と主要コンポーネントの状態を取り出す。"""
    if not isinstance(payload, dict):
        return None

    status = payload.get("status")
    if not isinstance(status, dict):
        return None

    components = [
        {"name": component.get("name"), "status": component.get("status")}
        for component in payload.get("components", [])
        if isinstance(component, dict) and component.get("name") in WATCHED_COMPONENTS
    ]

    return {
        "indicator": status.get("indicator") or "unknown",
        "description": status.get("description") or "状況不明",
        "components": components,
    }


# --- 取得 -----------------------------------------------------------------

GITHUB_API_HOST = "api.github.com"


def _headers(url: str) -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "gitramen-news"}
    token = os.getenv("GITHUB_TOKEN")
    # トークンは GitHub API 以外（githubstatus.com など）へ送らない
    if token and httpx.URL(url).host == GITHUB_API_HOST:  # 任意。設定するとレート制限が緩和される
        headers["Authorization"] = f"Bearer {token}"
    return headers


async def _get_json(client: httpx.AsyncClient, url: str) -> Any:
    response = await client.get(url, headers=_headers(url))
    response.raise_for_status()
    return response.json()


async def _get_text(client: httpx.AsyncClient, url: str) -> str:
    response = await client.get(url, headers={"User-Agent": "gitramen-news"})
    response.raise_for_status()
    return response.text


_client: Optional[httpx.AsyncClient] = None
_client_lock = asyncio.Lock()


async def get_client() -> httpx.AsyncClient:
    """AsyncClient を使い回す。

    毎回生成すると SSL コンテキストの構築とコネクション確立が都度発生し、
    取得時間が数百ミリ秒単位で増える。
    """
    global _client
    if _client is None or _client.is_closed:
        async with _client_lock:
            if _client is None or _client.is_closed:
                _client = httpx.AsyncClient(
                    timeout=REQUEST_TIMEOUT_SECONDS,
                    follow_redirects=True,
                    limits=httpx.Limits(max_keepalive_connections=8, max_connections=8),
                )
    return _client


async def close_client() -> None:
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None


_fetch_lock = asyncio.Lock()


async def fetch_news(use_cache: bool = True) -> dict[str, Any]:
    """Git / GitHub / GitRamen の更新情報と GitHub の稼働状況をまとめて返す。

    どれか1つの取得に失敗しても、取れた分だけを返し unavailable に記録する。
    """
    if use_cache:
        cached = cache.get("news")
        if cached is not None:
            return cached

    # キャッシュが切れた瞬間に同時アクセスが来ても、外部取得は1回にまとめる
    async with _fetch_lock:
        if use_cache:
            cached = cache.get("news")
            if cached is not None:
                return cached
        return await _fetch_and_cache(use_cache)


async def _fetch_and_cache(use_cache: bool) -> dict[str, Any]:
    unavailable: list[str] = []
    client = await get_client()

    async def _load(source: str, url: str, getter: Callable[..., Any], parser: Callable[[Any], Any]) -> Any:
        """取得できたソースは通常の TTL、失敗したソースだけ短い TTL で持つ。

        結果全体を短い TTL にすると、1つのソースの障害が続く間、取得できている
        GitHub API まで毎回呼び直してレート制限を使い切ってしまう。
        """
        key = f"source:{source}"
        if use_cache:
            hit = cache.get(key)
            if hit is not None:
                return hit[0]
        try:
            parsed = parser(await getter(client, url)) or None
        except Exception:
            parsed = None
        cache.set(key, (parsed,), None if parsed is not None else FAILED_CACHE_TTL_SECONDS)
        return parsed

    # 4件の取得は互いに独立しているので並列に投げる（直列だと合計レイテンシが4倍になる）
    results = await asyncio.gather(
        _load("git", GIT_TAGS_URL, _get_json, parse_git_tags),
        _load("github", GITHUB_CHANGELOG_URL, _get_text, parse_changelog_feed),
        _load("gitramen", GITRAMEN_COMMITS_URL, _get_json, parse_repo_commits),
        _load("status", GITHUB_STATUS_URL, _get_json, parse_github_status),
    )
    for source, result in zip(("git", "github", "gitramen", "status"), results):
        if result is None:
            unavailable.append(source)
    git, github, gitramen = (result or [] for result in results[:3])
    status = results[3]

    payload = {
        "git": [item.as_dict() for item in git],
        "github": [item.as_dict() for item in github],
        "gitramen": [item.as_dict() for item in gitramen],
        "status": status,
        "unavailable": unavailable,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    cache.set("news", payload, FAILED_CACHE_TTL_SECONDS if unavailable else None)
    return payload
