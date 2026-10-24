import pytest
from pydantic import ValidationError

from auth.config import AuthSettings

VALID_KEY = "a" * 32


def make(**kwargs):
    # .env の影響を受けないようにする
    return AuthSettings(_env_file=None, **kwargs)


def test_secret_key_unset_is_rejected(monkeypatch):
    monkeypatch.delenv("AUTH_SECRET_KEY", raising=False)
    with pytest.raises(ValidationError):
        make()


def test_leaked_default_secret_key_is_rejected():
    with pytest.raises(ValidationError):
        make(secret_key="dev-secret-key-change-in-production")


def test_secret_key_shorter_than_32_chars_is_rejected():
    with pytest.raises(ValidationError):
        make(secret_key="a" * 31)


def test_secret_key_of_exactly_32_chars_is_accepted():
    assert make(secret_key=VALID_KEY).secret_key == VALID_KEY


def test_secret_key_is_read_from_environment(monkeypatch):
    monkeypatch.setenv("AUTH_SECRET_KEY", "b" * 40)
    assert make().secret_key == "b" * 40
