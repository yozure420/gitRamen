from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class CmdBase(BaseModel):
    """Gitコマンドの基本スキーマ"""
    command: str = Field(..., max_length=100, description="Gitコマンド")
    description: Optional[str] = Field(None, description="コマンドの説明")
    course: int = Field(default=1, ge=1, le=4, description="難易度レベル (1=初級, 2=中級, 3=上級, 4=最上級)")


class CmdCreate(CmdBase):
    """コマンド作成時のスキーマ"""
    pass


class CmdUpdate(BaseModel):
    """コマンド更新時のスキーマ（全てオプショナル）"""
    command: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    course: Optional[int] = Field(None, ge=1, le=4)


class CmdResponse(CmdBase):
    """コマンドレスポンススキーマ"""
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class CmdListResponse(BaseModel):
    """コマンドリストのレスポンススキーマ"""
    commands: list[CmdResponse]
    total: int
    
    model_config = ConfigDict(from_attributes=True)
