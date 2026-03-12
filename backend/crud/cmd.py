from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..models.cmd import Cmd
from ..schemas.cmd import CmdCreate, CmdUpdate


def get_cmd(db: Session, cmd_id: int) -> Optional[Cmd]:
    """IDでコマンドを取得"""
    return db.query(Cmd).filter(Cmd.id == cmd_id).first()


def get_cmds(db: Session, skip: int = 0, limit: int = 100) -> list[Cmd]:
    """コマンドリストを取得（ページネーション対応）"""
    return db.query(Cmd).offset(skip).limit(limit).all()


def get_cmds_by_course(db: Session, course: int) -> list[Cmd]:
    """難易度レベル別にコマンドを取得"""
    return db.query(Cmd).filter(Cmd.course == course).all()


def get_random_cmds(db: Session, course: int, count: int = 10) -> list[Cmd]:
    """
    指定された難易度レベルからランダムにコマンドを取得（ゲーム用）
    
    Args:
        db: データベースセッション
        course: 難易度レベル (1-4)
        count: 取得数
    
    Returns:
        ランダムに選ばれたコマンドのリスト
    """
    return (
        db.query(Cmd)
        .filter(Cmd.course == course)
        .order_by(func.random())
        .limit(count)
        .all()
    )


def get_total_count(db: Session) -> int:
    """コマンド総数を取得"""
    return db.query(Cmd).count()


def get_count_by_course(db: Session, course: int) -> int:
    """難易度レベル別のコマンド数を取得"""
    return db.query(Cmd).filter(Cmd.course == course).count()


def create_cmd(db: Session, cmd: CmdCreate) -> Cmd:
    """新しいコマンドを作成"""
    db_cmd = Cmd(
        command=cmd.command,
        description=cmd.description,
        course=cmd.course
    )
    db.add(db_cmd)
    db.commit()
    db.refresh(db_cmd)
    return db_cmd


def update_cmd(db: Session, cmd_id: int, cmd_update: CmdUpdate) -> Optional[Cmd]:
    """コマンドを更新"""
    db_cmd = get_cmd(db, cmd_id)
    if not db_cmd:
        return None
    
    # 更新されたフィールドのみ適用
    update_data = cmd_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_cmd, field, value)
    
    db.commit()
    db.refresh(db_cmd)
    return db_cmd


def delete_cmd(db: Session, cmd_id: int) -> bool:
    """コマンドを削除"""
    db_cmd = get_cmd(db, cmd_id)
    if not db_cmd:
        return False
    
    db.delete(db_cmd)
    db.commit()
    return True


def bulk_create_cmds(db: Session, cmds: list[CmdCreate]) -> list[Cmd]:
    """複数のコマンドを一括作成"""
    db_cmds = [
        Cmd(
            command=cmd.command,
            description=cmd.description,
            course=cmd.course
        )
        for cmd in cmds
    ]
    db.add_all(db_cmds)
    db.commit()
    for cmd in db_cmds:
        db.refresh(cmd)
    return db_cmds
