"""既存 DB 向けの簡易マイグレーション（不足カラムの追加のみ）"""
from sqlalchemy import inspect
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DBAPIError

# {true} は DB ごとの真偽値リテラルに置き換える（SQLite は 1、PostgreSQL などは TRUE）
COMMAND_COLUMN_MIGRATIONS = {
    "game_note": "ALTER TABLE command ADD COLUMN game_note TEXT",
    "course": "ALTER TABLE command ADD COLUMN course INTEGER NOT NULL DEFAULT 1",
    # 既存DBは再シードされるまで従来どおり全コマンドを表示する
    "playable": "ALTER TABLE command ADD COLUMN playable BOOLEAN NOT NULL DEFAULT {true}",
}


def _command_columns(engine: Engine) -> set[str]:
    return {column["name"] for column in inspect(engine).get_columns("command")}


def ensure_schema(engine: Engine) -> None:
    true_literal = "TRUE" if engine.dialect.supports_native_boolean else "1"
    column_names = _command_columns(engine)
    for column, ddl in COMMAND_COLUMN_MIGRATIONS.items():
        if column in column_names:
            continue
        try:
            with engine.begin() as conn:
                conn.exec_driver_sql(ddl.format(true=true_literal))
        except DBAPIError:
            # 複数ワーカーの同時起動で、他のワーカーが先に追加していた場合は無視する
            if column not in _command_columns(engine):
                raise
