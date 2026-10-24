from datetime import timedelta

from auth.jwt import create_access_token, decode_token
from auth.password import hash_password, verify_password


def test_hash_and_verify_password():
    hashed = hash_password("ramen-secret")
    assert hashed != "ramen-secret"
    assert verify_password("ramen-secret", hashed)
    assert not verify_password("wrong", hashed)


def test_token_round_trip():
    token = create_access_token({"sub": "user-1", "name": "taro"})
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-1"
    assert "exp" in payload


def test_tampered_token_is_rejected():
    token = create_access_token({"sub": "user-1"})
    assert decode_token(token[:-2] + ("aa" if not token.endswith("aa") else "bb")) is None


def test_expired_token_is_rejected():
    token = create_access_token({"sub": "user-1"}, expires_delta=timedelta(seconds=-1))
    assert decode_token(token) is None
