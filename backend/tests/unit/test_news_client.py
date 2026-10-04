import asyncio

import news


def test_client_is_reused_until_closed():
    """毎回生成すると SSL コンテキスト構築で数百ミリ秒かかるため、使い回しを保証する"""

    async def scenario():
        first = await news.get_client()
        second = await news.get_client()
        assert first is second
        assert not first.is_closed

        await news.close_client()
        assert first.is_closed

        third = await news.get_client()
        assert third is not first
        await news.close_client()

    asyncio.run(scenario())


def test_close_client_is_safe_without_client():
    asyncio.run(news.close_client())


def test_github_token_is_only_sent_to_github_api(monkeypatch):
    """トークンを第三者のホスト（githubstatus.com）へ漏らさないこと"""
    monkeypatch.setenv("GITHUB_TOKEN", "secret-token")

    assert news._headers(news.GIT_TAGS_URL)["Authorization"] == "Bearer secret-token"
    assert news._headers(news.GITRAMEN_COMMITS_URL)["Authorization"] == "Bearer secret-token"
    assert "Authorization" not in news._headers(news.GITHUB_STATUS_URL)
    assert "Authorization" not in news._headers(news.GITHUB_CHANGELOG_URL)


def test_no_authorization_header_without_token(monkeypatch):
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    assert "Authorization" not in news._headers(news.GIT_TAGS_URL)
