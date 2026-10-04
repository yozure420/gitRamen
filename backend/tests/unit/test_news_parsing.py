import news
from news import TtlCache, parse_changelog_feed, parse_git_tags, parse_github_status, parse_repo_commits


def test_parse_git_tags_keeps_release_tags_newest_first():
    payload = [
        {"name": "v2.51.0"},
        {"name": "v2.49.1"},
        {"name": "v2.52.0-rc1"},  # RC は除外
        {"name": "junio-gpg-pub"},  # リリースでないタグは除外
        {"name": "v2.50.0"},
    ]

    items = parse_git_tags(payload)

    assert [item.title for item in items] == [
        "Git 2.51.0 がリリースされました",
        "Git 2.50.0 がリリースされました",
        "Git 2.49.1 がリリースされました",
    ]
    assert items[0].url == "https://github.com/git/git/releases/tag/v2.51.0"
    assert items[0].source == "git"


def test_parse_git_tags_limits_and_handles_bad_payload():
    payload = [{"name": f"v2.{minor}.0"} for minor in range(40, 52)]
    assert len(parse_git_tags(payload, limit=3)) == 3
    assert parse_git_tags({"unexpected": True}) == []
    assert parse_git_tags([{"no_name": 1}, "garbage"]) == []


def test_parse_changelog_feed_reads_rss_items():
    feed = """<?xml version="1.0"?>
    <rss version="2.0"><channel>
      <item>
        <title>Copilot code review now generally available</title>
        <link>https://github.blog/changelog/copilot</link>
        <pubDate>Tue, 15 Apr 2025 10:00:00 +0000</pubDate>
      </item>
      <item>
        <title>Actions runner update</title>
        <link>https://github.blog/changelog/actions</link>
        <pubDate>bogus date</pubDate>
      </item>
      <item><title>no link</title></item>
    </channel></rss>"""

    items = parse_changelog_feed(feed)

    assert [item.title for item in items] == ["Copilot code review now generally available", "Actions runner update"]
    assert items[0].published_at.startswith("2025-04-15T10:00:00")
    assert items[1].published_at is None
    assert all(item.source == "github" for item in items)


def test_parse_changelog_feed_handles_broken_xml():
    assert parse_changelog_feed("<rss><channel>") == []


def test_parse_repo_commits_uses_first_message_line():
    payload = [
        {
            "html_url": "https://github.com/yozure420/gitRamen/commit/abc",
            "commit": {"message": "feat: 上級コースを実装\n\n詳細な説明", "author": {"date": "2026-09-16T01:02:03Z"}},
        },
        {"commit": {"message": "fix: 誤配達の修正", "author": {}}},
        {"commit": {"message": ""}},
    ]

    items = parse_repo_commits(payload)

    assert [item.title for item in items] == ["feat: 上級コースを実装", "fix: 誤配達の修正"]
    assert items[0].published_at.startswith("2026-09-16T01:02:03")
    assert items[1].url == "https://github.com/yozure420/gitRamen"
    assert items[1].published_at is None


def test_parse_github_status_picks_watched_components():
    payload = {
        "status": {"indicator": "minor", "description": "Partially Degraded Service"},
        "components": [
            {"name": "Git Operations", "status": "operational"},
            {"name": "Actions", "status": "degraded_performance"},
            {"name": "Codespaces", "status": "operational"},  # 対象外
        ],
    }

    status = parse_github_status(payload)

    assert status["indicator"] == "minor"
    assert status["description"] == "Partially Degraded Service"
    assert status["components"] == [
        {"name": "Git Operations", "status": "operational"},
        {"name": "Actions", "status": "degraded_performance"},
    ]


def test_parse_github_status_handles_bad_payload():
    assert parse_github_status({"no_status": 1}) is None
    assert parse_github_status("garbage") is None


def test_ttl_cache_expires_entries():
    now = {"value": 0.0}
    cache = TtlCache(ttl_seconds=10, clock=lambda: now["value"])

    cache.set("k", {"a": 1})
    assert cache.get("k") == {"a": 1}

    now["value"] = 9.9
    assert cache.get("k") == {"a": 1}

    now["value"] = 10.0
    assert cache.get("k") is None


def test_module_cache_is_configured_with_ten_minute_ttl():
    assert news.CACHE_TTL_SECONDS == 600
