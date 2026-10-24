from news import TtlCache


def _cache(now, ttl=10):
    return TtlCache(ttl_seconds=ttl, clock=lambda: now["value"])


def test_entry_ttl_overrides_default_ttl_shorter():
    now = {"value": 0.0}
    cache = _cache(now, ttl=100)

    cache.set("k", "v", ttl_seconds=5)

    now["value"] = 4.9
    assert cache.get("k") == "v"
    now["value"] = 5.0
    assert cache.get("k") is None


def test_entry_ttl_overrides_default_ttl_longer():
    now = {"value": 0.0}
    cache = _cache(now, ttl=5)

    cache.set("k", "v", ttl_seconds=50)

    now["value"] = 49.9
    assert cache.get("k") == "v"


def test_entries_with_different_ttls_expire_independently():
    now = {"value": 0.0}
    cache = _cache(now, ttl=10)
    cache.set("short", 1, ttl_seconds=2)
    cache.set("default", 2)

    now["value"] = 3.0

    assert cache.get("short") is None
    assert cache.get("default") == 2


def test_none_entry_ttl_falls_back_to_default_ttl():
    now = {"value": 0.0}
    cache = _cache(now, ttl=10)

    cache.set("k", "v", ttl_seconds=None)

    now["value"] = 9.9
    assert cache.get("k") == "v"
    now["value"] = 10.0
    assert cache.get("k") is None


def test_zero_entry_ttl_expires_immediately():
    now = {"value": 0.0}
    cache = _cache(now)

    cache.set("k", "v", ttl_seconds=0)

    assert cache.get("k") is None
