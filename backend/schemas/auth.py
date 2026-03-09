from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    name: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True
