from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from .config import auth_settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=auth_settings.access_token_expire_days
        )
    to_encode["exp"] = expire
    return jwt.encode(
        to_encode, auth_settings.secret_key, algorithm=auth_settings.algorithm
    )


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token. Returns payload or None if invalid."""
    try:
        payload = jwt.decode(
            token, auth_settings.secret_key, algorithms=[auth_settings.algorithm]
        )
        return payload
    except JWTError:
        return None
