from pydantic_settings import BaseSettings

# 認証設定
class AuthSettings(BaseSettings):
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_days: int = 7

    class Config:
        env_file = ".env"
        env_prefix = "AUTH_"


auth_settings = AuthSettings()
