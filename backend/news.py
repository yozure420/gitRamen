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
        stored_at, value = entry
        if self._clock() - stored_at >= self._ttl:
            del self._entries[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._entries[key] = (self._clock(), value)

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


async def fetch_news(use_cache: bool = True) -> dict[str, Any]:
    """Git / GitHub / GitRamen の更新情報と GitHub の稼働状況をまとめて返す。

    どれか1つの取得に失敗しても、取れた分だけを返し unavailable に記録する。
    """
    if use_cache:
        cached = cache.get("news")
        if cached is not None:
            return cached

    unavailable: list[str] = []

    client = await get_client()
    # 4件の取得は互いに独立しているので並列に投げる（直列だと合計レイテンシが4倍になる）
    raw_git, raw_github, raw_gitramen, raw_status = await asyncio.gather(
        _get_json(client, GIT_TAGS_URL),
        _get_text(client, GITHUB_CHANGELOG_URL),
        _get_json(client, GITRAMEN_COMMITS_URL),
        _get_json(client, GITHUB_STATUS_URL),
        return_exceptions=True,
    )

    def _parse(source: str, raw: Any, parser: Callable[[Any], Any], fallback: Any) -> Any:
        if isinstance(raw, BaseException):
            unavailable.append(source)
            return fallback
        try:
            parsed = parser(raw)
        except Exception:
            unavailable.append(source)
            return fallback
        if not parsed:
            unavailable.append(source)
            return fallback
        return parsed

    git = _parse("git", raw_git, parse_git_tags, [])
    github = _parse("github", raw_github, parse_changelog_feed, [])
    gitramen = _parse("gitramen", raw_gitramen, parse_repo_commits, [])
    status = _parse("status", raw_status, parse_github_status, None)

    payload = {
        "git": [item.as_dict() for item in git],
        "github": [item.as_dict() for item in github],
        "gitramen": [item.as_dict() for item in gitramen],
        "status": status,
        "unavailable": unavailable,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    cache.set("news", payload)
    return payload
