import pytest


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


@pytest.mark.parametrize("course", [1, 2, 3, 4])
def test_course_catalog_playable_only_returns_implemented_commands(client, seeded_db, course):
    response = client.get(f"/commands/course?course={course}&playable_only=true")

    assert response.status_code == 200
    body = response.json()
    assert {row["command"] for row in body} == seeded_db.PLAYABLE_COMMANDS[course]
    assert all(row["playable"] and row["course"] == course for row in body)
    assert [row["id"] for row in body] == sorted(row["id"] for row in body)


def test_course_catalog_without_filter_includes_unimplemented_commands(client):
    body = client.get("/commands/course?course=2").json()
    commands = {row["command"] for row in body}
    assert "git rebase <branch>" in commands
    assert any(not row["playable"] for row in body)


def test_random_commands_respects_count_and_filter(client, seeded_db):
    body = client.get("/commands/random?course=2&count=3&playable_only=true").json()
    assert len(body) == 3
    assert {row["command"] for row in body} <= seeded_db.PLAYABLE_COMMANDS[2]


def test_random_commands_caps_count_to_available(client, seeded_db):
    body = client.get("/commands/random?course=4&count=100&playable_only=true").json()
    assert len(body) == len(seeded_db.PLAYABLE_COMMANDS[4])


def test_unknown_course_returns_404(client):
    assert client.get("/commands/course?course=99").status_code == 404
    assert client.get("/commands/random?course=99").status_code == 404


def test_get_command_by_id_and_check(client):
    command = client.get("/commands/course?course=1&playable_only=true").json()[0]

    assert client.get(f"/commands/{command['id']}").json()["command"] == command["command"]
    assert client.get("/commands/999999").status_code == 404

    correct = client.post("/commands/check", json={"user_input": f"  {command['command'].upper()} ", "command_id": command["id"]})
    assert correct.json()["is_correct"] is True
    wrong = client.post("/commands/check", json={"user_input": "git nope", "command_id": command["id"]})
    assert wrong.json()["is_correct"] is False
