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
