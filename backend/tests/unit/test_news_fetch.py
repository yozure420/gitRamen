"""news.py の取得処理。httpx.MockTransport / スタブで外部ネットワークに出ずに検証する"""
import asyncio

import httpx
import pytest

import news


@pytest.fixture(autouse=True)
def clean_state():
    news.cache.clear()
    yield
    news.cache.clear()


def _run_with_transport(handler, coro_factory):
    async def scenario():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await coro_factory(client)

    return asyncio.run(scenario())


def test_get_json_returns_parsed_body_and_sends_github_headers(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "secret-token")
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers.get("authorization")
        seen["agent"] = request.headers.get("user-agent")
        return httpx.Response(200, json=[{"name": "v2.51.0"}])

    result = _run_with_transport(handler, lambda c: news._get_json(c, news.GIT_TAGS_URL))

    assert result == [{"name": "v2.51.0"}]
    assert seen == {"auth": "Bearer secret-token", "agent": "gitramen-news"}


def test_get_json_raises_on_http_error_status():
    def handler(request):
        return httpx.Response(403, json={"message": "rate limit"})

    with pytest.raises(httpx.HTTPStatusError):
        _run_with_transport(handler, lambda c: news._get_json(c, news.GIT_TAGS_URL))


def test_get_json_raises_on_invalid_json_body():
    def handler(request):
        return httpx.Response(200, text="<html>not json</html>")

    with pytest.raises(ValueError):
        _run_with_transport(handler, lambda c: news._get_json(c, news.GITHUB_STATUS_URL))


def test_get_text_never_sends_authorization_even_with_token(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "secret-token")
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers.get("authorization")
        return httpx.Response(200, text="<rss/>")

    assert _run_with_transport(handler, lambda c: news._get_text(c, news.GITHUB_CHANGELOG_URL)) == "<rss/>"
    assert seen["auth"] is None


def test_get_text_raises_on_http_error_status():
    def handler(request):
        return httpx.Response(500)

    with pytest.raises(httpx.HTTPStatusError):
        _run_with_transport(handler, lambda c: news._get_text(c, news.GITHUB_CHANGELOG_URL))


def test_get_client_returns_same_instance_for_concurrent_callers():
    async def scenario():
        clients = await asyncio.gather(*[news.get_client() for _ in range(10)])
        await news.close_client()
        return clients

    clients = asyncio.run(scenario())

    assert all(c is clients[0] for c in clients)


def test_get_client_is_configured_with_timeout_and_redirects():
    async def scenario():
        client = await news.get_client()
        try:
            return client.timeout, client.follow_redirects
        finally:
            await news.close_client()

    timeout, follow = asyncio.run(scenario())

    assert timeout == httpx.Timeout(news.REQUEST_TIMEOUT_SECONDS)
    assert follow is True


def _stub_fetchers(monkeypatch, *, json_map=None, text=None, errors=None):
    json_map = json_map or {}
    errors = errors or {}

    async def fake_client():
        return object()

    async def fake_json(_c, url):
        if url in errors:
            raise errors[url]
        return json_map[url]

    async def fake_text(_c, url):
        if url in errors:
            raise errors[url]
        return text

    monkeypatch.setattr(news, "get_client", fake_client)
    monkeypatch.setattr(news, "_get_json", fake_json)
    monkeypatch.setattr(news, "_get_text", fake_text)


GOOD_JSON = {
    news.GIT_TAGS_URL: [{"name": "v2.51.0"}],
    news.GITRAMEN_COMMITS_URL: [{"commit": {"message": "feat: x"}}],
    news.GITHUB_STATUS_URL: {"status": {"indicator": "none", "description": "ok"}, "components": []},
}
GOOD_FEED = "<rss><channel><item><title>t</title><link>https://x.test/1</link></item></channel></rss>"


def test_fetch_news_marks_timeout_as_unavailable(monkeypatch):
    _stub_fetchers(
        monkeypatch, json_map=GOOD_JSON, text=GOOD_FEED,
        errors={news.GIT_TAGS_URL: httpx.ReadTimeout("slow")},
    )

    result = asyncio.run(news.fetch_news())

    assert result["unavailable"] == ["git"]
    assert result["git"] == []
    assert result["github"] and result["gitramen"] and result["status"]


def test_fetch_news_marks_unexpected_payload_shape_as_unavailable(monkeypatch):
    json_map = {**GOOD_JSON, news.GIT_TAGS_URL: {"message": "API rate limit exceeded"}}
    _stub_fetchers(monkeypatch, json_map=json_map, text="<rss><channel>")

    result = asyncio.run(news.fetch_news())

    assert set(result["unavailable"]) == {"git", "github"}


def test_fetch_news_marks_valid_but_empty_result_as_unavailable(monkeypatch):
    """タグが全て RC などで表示できる項目が 0 件のときも欠落として扱う"""
    json_map = {**GOOD_JSON, news.GIT_TAGS_URL: [{"name": "v2.52.0-rc0"}]}
    _stub_fetchers(monkeypatch, json_map=json_map, text=GOOD_FEED)

    assert asyncio.run(news.fetch_news())["unavailable"] == ["git"]


def test_fetch_news_absorbs_parser_exception_on_malformed_nested_fields(monkeypatch):
    """parse_repo_commits は commit が文字列だと例外を投げるが、fetch_news が吸収して欠落扱いにする"""
    json_map = {**GOOD_JSON, news.GITRAMEN_COMMITS_URL: [{"commit": "not-a-dict"}]}
    _stub_fetchers(monkeypatch, json_map=json_map, text=GOOD_FEED)

    result = asyncio.run(news.fetch_news())

    assert result["unavailable"] == ["gitramen"]
    assert result["gitramen"] == []


def test_fetch_news_serves_cached_payload_without_refetching(monkeypatch):
    calls = {"n": 0}
    _stub_fetchers(monkeypatch, json_map=GOOD_JSON, text=GOOD_FEED)

    async def counting_client():
        calls["n"] += 1
        return object()

    monkeypatch.setattr(news, "get_client", counting_client)

    first = asyncio.run(news.fetch_news())
    second = asyncio.run(news.fetch_news())
    asyncio.run(news.fetch_news(use_cache=False))

    assert second is first
    assert calls["n"] == 2  # キャッシュヒット時は取得処理が走らない
