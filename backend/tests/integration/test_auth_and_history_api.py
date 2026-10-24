import uuid


def test_register_login_me_flow(client):
    name = f"user-{uuid.uuid4().hex[:8]}"

    registered = client.post("/auth/register", json={"name": name, "password": "password123"})
    assert registered.status_code == 200
    assert registered.json()["title"] == "Git見習い"
    assert "hashed_password" not in registered.json()

    assert client.post("/auth/register", json={"name": name, "password": "password123"}).status_code == 400

    login = client.post("/auth/login", json={"name": name, "password": "password123"})
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["name"] == name


def test_login_rejects_wrong_password(client):
    name = f"user-{uuid.uuid4().hex[:8]}"
    client.post("/auth/register", json={"name": name, "password": "password123"})
    assert client.post("/auth/login", json={"name": name, "password": "nope"}).status_code == 401


def test_register_validates_password_length(client):
    assert client.post("/auth/register", json={"name": "short", "password": "123"}).status_code == 422


def test_protected_endpoints_require_token(client):
    assert client.get("/auth/me").status_code == 401
    assert client.get("/users/me/stats").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer invalid"}).status_code == 401
    assert client.post("/history", json={"course": 1, "score": 10}).status_code == 401


def test_history_is_reflected_in_stats(client, auth_headers):
    commands = client.get("/commands/course?course=2&playable_only=true").json()
    stash, amend = commands[0], commands[-1]

    empty = client.get("/users/me/stats", headers=auth_headers).json()
    assert empty["total_plays"] == 0
    assert empty["best_score"] == 0
    assert empty["last_play"] is None

    first = client.post("/history", headers=auth_headers, json={
        "course": 2,
        "score": 300,
        "misses": [{"command_id": stash["id"], "miss_count": 2}, {"command_id": amend["id"], "miss_count": 0}],
    })
    assert first.status_code == 201
    client.post("/history", headers=auth_headers, json={
        "course": 3,
        "score": 900,
        "misses": [{"command_id": stash["id"], "miss_count": 1}, {"command_id": amend["id"], "miss_count": 1}],
    })

    stats = client.get("/users/me/stats", headers=auth_headers).json()
    assert stats["total_plays"] == 2
    assert stats["best_score"] == 900
    assert stats["last_play"] is not None
    assert stats["missed_commands"] == [
        {"cmd": stash["command"], "count": 3},
        {"cmd": amend["command"], "count": 1},
    ]


def _bearer(payload):
    from auth.jwt import create_access_token

    return {"Authorization": f"Bearer {create_access_token(payload)}"}


def test_me_returns_401_when_sub_is_not_a_uuid(client):
    assert client.get("/auth/me", headers=_bearer({"sub": "not-a-uuid"})).status_code == 401


def test_me_returns_401_when_sub_is_missing(client):
    assert client.get("/auth/me", headers=_bearer({"foo": "bar"})).status_code == 401


def test_me_returns_401_when_user_does_not_exist(client):
    assert client.get("/auth/me", headers=_bearer({"sub": str(uuid.uuid4())})).status_code == 401


def _register(client, password):
    return client.post("/auth/register", json={"name": f"u-{uuid.uuid4().hex[:8]}", "password": password})


def test_register_accepts_password_of_exactly_72_bytes(client):
    assert _register(client, "a" * 72).status_code == 200


def test_register_rejects_password_of_73_bytes(client):
    assert _register(client, "a" * 73).status_code == 422


def test_register_rejects_25_fullwidth_chars_75_bytes(client):
    assert _register(client, "あ" * 25).status_code == 422


def test_register_accepts_24_fullwidth_chars_72_bytes(client):
    assert _register(client, "あ" * 24).status_code == 200


def test_login_passes_validation_with_password_of_100_chars(client):
    # 100 文字はスキーマ上は通り、認証失敗の 401 になる（422 ではない）
    r = client.post("/auth/login", json={"name": "nobody", "password": "a" * 100})
    assert r.status_code == 401


def test_login_rejects_password_of_101_chars(client):
    r = client.post("/auth/login", json={"name": "nobody", "password": "a" * 101})
    assert r.status_code == 422
