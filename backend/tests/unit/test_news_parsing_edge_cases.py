"""news.py のパース関数の境界値・欠損フィールドの扱い（既存の test_news_parsing.py を補う）"""
import news
from news import parse_changelog_feed, parse_git_tags, parse_github_status, parse_repo_commits


def test_parse_git_tags_sorts_versions_numerically_not_lexically():
    items = parse_git_tags([{"name": "v2.9.0"}, {"name": "v2.10.0"}, {"name": "v2.100.0"}])

    assert [item.title for item in items] == [
        "Git 2.100.0 がリリースされました",
        "Git 2.10.0 がリリースされました",
        "Git 2.9.0 がリリースされました",
    ]


def test_parse_git_tags_accepts_tag_without_patch_number():
    items = parse_git_tags([{"name": "v2.40"}, {"name": "v2.39.5"}])

    assert [item.title for item in items] == ["Git 2.40 がリリースされました", "Git 2.39.5 がリリースされました"]


def test_parse_git_tags_ignores_non_string_names_and_empty_list():
    assert parse_git_tags([]) == []
    assert parse_git_tags([{"name": 2}, {"name": None}, None]) == []


def test_parse_git_tags_rejects_four_part_and_suffixed_versions():
    assert parse_git_tags([{"name": "v2.51.0.1"}, {"name": "v2.51.0-rc2"}, {"name": "2.51.0"}]) == []


def test_parse_changelog_feed_respects_limit():
    entries = "".join(f"<item><title>t{i}</title><link>https://x.test/{i}</link></item>" for i in range(10))

    items = parse_changelog_feed(f"<rss><channel>{entries}</channel></rss>", limit=3)

    assert [item.title for item in items] == ["t0", "t1", "t2"]


def test_parse_changelog_feed_skips_blank_title_or_link_and_trims_whitespace():
    feed = """<rss><channel>
      <item><title>   </title><link>https://x.test/blank</link></item>
      <item><title>no link</title><link>  </link></item>
      <item><title>  padded  </title><link>  https://x.test/ok  </link></item>
    </channel></rss>"""

    items = parse_changelog_feed(feed)

    assert [(item.title, item.url) for item in items] == [("padded", "https://x.test/ok")]


def test_parse_changelog_feed_returns_empty_for_empty_text_and_feed_without_items():
    assert parse_changelog_feed("") == []
    assert parse_changelog_feed("<rss><channel></channel></rss>") == []


def test_parse_repo_commits_returns_empty_for_non_list_and_skips_non_dict_rows():
    assert parse_repo_commits(None) == []
    assert parse_repo_commits({"message": "x"}) == []
    assert parse_repo_commits(["str", 1, None]) == []


def test_parse_repo_commits_handles_missing_commit_or_null_fields():
    payload = [
        {},  # commit 自体が無い
        {"commit": None},
        {"commit": {"message": None}},
        {"commit": {"message": "fix: ok", "author": None}, "html_url": None},
    ]

    items = parse_repo_commits(payload)

    assert len(items) == 1
    assert items[0].title == "fix: ok"
    assert items[0].published_at is None
    assert items[0].url == "https://github.com/yozure420/gitRamen"


def test_parse_repo_commits_respects_limit():
    payload = [{"commit": {"message": f"c{i}"}} for i in range(10)]

    assert [item.title for item in parse_repo_commits(payload, limit=2)] == ["c0", "c1"]


def test_parse_repo_commits_skips_whitespace_only_message():
    assert parse_repo_commits([{"commit": {"message": "  \n  "}}]) == []


def test_parse_github_status_falls_back_when_indicator_and_description_missing():
    status = parse_github_status({"status": {}})

    assert status == {"indicator": "unknown", "description": "状況不明", "components": []}


def test_parse_github_status_ignores_non_dict_components_and_missing_components_key():
    payload = {
        "status": {"indicator": "none", "description": "ok"},
        "components": ["garbage", None, {"name": "Actions", "status": "operational"}],
    }

    assert parse_github_status(payload)["components"] == [{"name": "Actions", "status": "operational"}]
    assert parse_github_status({"status": {"indicator": "none", "description": "ok"}})["components"] == []


def test_parse_github_status_rejects_non_dict_status_field():
    assert parse_github_status({"status": "operational"}) is None
    assert parse_github_status(None) is None
    assert parse_github_status([]) is None


def test_to_iso_normalizes_to_utc_and_handles_invalid_values():
    assert news._to_iso("2026-09-16T09:00:00+09:00") == "2026-09-16T00:00:00+00:00"
    assert news._to_iso("2026-09-16T01:02:03Z") == "2026-09-16T01:02:03+00:00"
    assert news._to_iso("Tue, 15 Apr 2025 10:00:00 +0900") == "2025-04-15T01:00:00+00:00"
    assert news._to_iso("") is None
    assert news._to_iso(None) is None
    assert news._to_iso("not a date") is None
