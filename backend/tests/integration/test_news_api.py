import asyncio
import time

import pytest

import news

GIT_TAGS = [{"name": "v2.51.0"}, {"name": "v2.50.1"}]
CHANGELOG = """<?xml version="1.0"?><rss><channel>
  <item><title>GitHub Actions の更新</title><link>https://github.blog/changelog/a</link>
  <pubDate>Tue, 15 Apr 2025 10:00:00 +0000</pubDate></item>
</channel></rss>"""
COMMITS = [{
    "html_url": "https://github.com/yozure420/gitRamen/commit/abc",
    "commit": {"message": "feat: ニュース欄を追加", "author": {"date": "2026-09-16T00:00:00Z"}},
}]
STATUS = {
    "status": {"indicator": "none", "description": "All Systems Operational"},
    "components": [{"name": "Git Operations", "status": "operational"}],
}


@pytest.fixture(autouse=True)
def clear_news_cache(monkeypatch):
    # asyncio.Lock は最初に競合したイベントループに結び付くので、テストごとに作り直す
    monkeypatch.setattr(news, "_fetch_lock", asyncio.Lock())
    news.cache.clear()
    yield
    news.cache.clear()


@pytest.fixture()
def stub_sources(monkeypatch):
    """外部 API を叩かずに /news を検証するためのスタブ。失敗させたい URL を指定できる。"""
    def install(*, fail_urls: set[str] = frozenset(), delay: float = 0.0, counter: dict | None = None):
        async def fake_get_json(_client, url):
            if counter is not None:
                counter[url] = counter.get(url, 0) + 1
            if delay:
                await asyncio.sleep(delay)
            if url in fail_urls:
                raise RuntimeError("boom")
            if url == news.GIT_TAGS_URL:
                return GIT_TAGS
            if url == news.GITRAMEN_COMMITS_URL:
                return COMMITS
            return STATUS

        async def fake_get_text(_client, url):
            if counter is not None:
                counter[url] = counter.get(url, 0) + 1
            if delay:
                await asyncio.sleep(delay)
            if url in fail_urls:
                raise RuntimeError("boom")
            return CHANGELOG

        async def fake_get_client():
            # 取得関数を差し替えているので実クライアントは不要。
            # 生成すると SSL コンテキスト構築で数百 ms かかり、計測系のテストが不安定になる
            return object()

        monkeypatch.setattr(news, "_get_json", fake_get_json)
        monkeypatch.setattr(news, "_get_text", fake_get_text)
        monkeypatch.setattr(news, "get_client", fake_get_client)

    return install


def test_news_endpoint_returns_all_sources_and_status(client, stub_sources):
    stub_sources()

    body = client.get("/news").json()

    assert [item["title"] for item in body["git"]] == [
        "Git 2.51.0 がリリースされました",
        "Git 2.50.1 がリリースされました",
    ]
    assert body["github"][0]["title"] == "GitHub Actions の更新"
    assert body["gitramen"][0]["title"] == "feat: ニュース欄を追加"
    assert body["status"] == {
        "indicator": "none",
        "description": "All Systems Operational",
        "components": [{"name": "Git Operations", "status": "operational"}],
    }
    assert body["unavailable"] == []
    assert body["fetched_at"]


def test_news_endpoint_degrades_when_one_source_fails(client, stub_sources):
    stub_sources(fail_urls={news.GITHUB_CHANGELOG_URL})

    body = client.get("/news").json()

    assert body["github"] == []
    assert body["unavailable"] == ["github"]
    # 他のソースは取得できている
    assert body["git"] and body["gitramen"] and body["status"]


def test_news_endpoint_survives_total_outage(client, stub_sources):
    stub_sources(fail_urls={
        news.GIT_TAGS_URL, news.GITHUB_CHANGELOG_URL, news.GITRAMEN_COMMITS_URL, news.GITHUB_STATUS_URL,
    })

    response = client.get("/news")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] is None
    assert set(body["unavailable"]) == {"git", "github", "gitramen", "status"}


def test_news_endpoint_uses_cache_and_ignores_refresh_param(client, stub_sources):
    counter: dict[str, int] = {}
    stub_sources(counter=counter)

    first = client.get("/news").json()
    second = client.get("/news").json()
    assert counter[news.GIT_TAGS_URL] == 1  # 2回目はキャッシュから返る
    assert second["fetched_at"] == first["fetched_at"]

    # 公開エンドポイントからキャッシュを迂回して外部 API を叩かせない
    refreshed = client.get("/news?refresh=true").json()
    assert counter[news.GIT_TAGS_URL] == 1
    assert refreshed["fetched_at"] == first["fetched_at"]


def test_failed_result_is_cached_only_briefly(client, stub_sources, monkeypatch):
    now = {"value": 0.0}
    monkeypatch.setattr(news, "cache", news.TtlCache(clock=lambda: now["value"]))
    counter: dict[str, int] = {}
    stub_sources(fail_urls={news.GIT_TAGS_URL}, counter=counter)

    assert client.get("/news").json()["unavailable"] == ["git"]
    now["value"] = news.FAILED_CACHE_TTL_SECONDS - 1
    client.get("/news")
    assert counter[news.GIT_TAGS_URL] == 1  # 失敗直後の連続アクセスでは取り直さない

    stub_sources(counter=counter)
    now["value"] = news.FAILED_CACHE_TTL_SECONDS
    assert client.get("/news").json()["unavailable"] == []  # 短い TTL が切れたら復旧する
    # 取り直すのは失敗したソースだけ。取得できていた GitHub API まで呼び直さない
    assert counter[news.GITRAMEN_COMMITS_URL] == 1
    now["value"] = news.FAILED_CACHE_TTL_SECONDS + news.CACHE_TTL_SECONDS - 1
    client.get("/news")
    assert counter[news.GIT_TAGS_URL] == 2  # 成功した結果は通常の TTL で持つ


def test_concurrent_requests_share_one_fetch(stub_sources):
    counter: dict[str, int] = {}
    stub_sources(delay=0.05, counter=counter)

    async def scenario():
        return await asyncio.gather(*(news.fetch_news() for _ in range(5)))

    results = asyncio.run(scenario())

    assert counter[news.GIT_TAGS_URL] == 1
    assert all(result is results[0] for result in results)


def test_news_sources_are_fetched_in_parallel(client, stub_sources):
    """4ソースを直列に取ると待ち時間が4倍になるため、並列で取得していることを確認する"""
    delay = 0.2
    stub_sources(delay=delay)

    started = time.perf_counter()
    client.get("/news")
    elapsed = time.perf_counter() - started

    assert elapsed < delay * 2, f"並列化されていない可能性があります (elapsed={elapsed:.3f}s)"
