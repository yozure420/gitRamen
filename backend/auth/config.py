from pydantic import field_validator
from pydantic_settings import BaseSettings

# 以前の既定値。リポジトリに載っていて誰でも JWT を偽造できるため、使われていたら起動を止める
_LEAKED_SECRET_KEY = "dev-secret-key-change-in-production"
_MIN_SECRET_KEY_LENGTH = 32


# 認証設定
class AuthSettings(BaseSettings):
    # 既定値は持たない。環境変数 AUTH_SECRET_KEY（または .env）で必ず渡す
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_days: int = 7

    class Config:
        env_file = ".env"
        env_prefix = "AUTH_"

    @field_validator("secret_key")
    @classmethod
    def _reject_weak_secret_key(cls, value: str) -> str:
        if value == _LEAKED_SECRET_KEY:
            raise ValueError("AUTH_SECRET_KEY に公開済みの既定値が使われています。ランダムな値に変えてください")
        if len(value) < _MIN_SECRET_KEY_LENGTH:
            raise ValueError(f"AUTH_SECRET_KEY は {_MIN_SECRET_KEY_LENGTH} 文字以上にしてください")
        return value


auth_settings = AuthSettings()
