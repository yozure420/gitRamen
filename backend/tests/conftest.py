import os
import sys
import tempfile
import uuid
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# database.py が読み込まれる前に、テスト専用の SQLite に向ける（本番DBを触らない）
_TEST_DB_DIR = Path(tempfile.mkdtemp(prefix="gitramen-test-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_TEST_DB_DIR / 'test.db').as_posix()}"
# auth.config は署名鍵が未設定だと起動を止めるので、テスト用の鍵を渡す
os.environ.setdefault("AUTH_SECRET_KEY", "test-secret-key-for-pytest-only-0123456789")


@pytest.fixture(scope="session")
def seeded_db():
    import seed

    seed.seed_database()
    return seed


@pytest.fixture()
def client(seeded_db):
    from fastapi.testclient import TestClient
    from app import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def auth_headers(client):
    name = f"tester-{uuid.uuid4().hex[:8]}"
    password = "password123"
    assert client.post("/auth/register", json={"name": name, "password": password}).status_code == 200
    token = client.post("/auth/login", json={"name": name, "password": password}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
