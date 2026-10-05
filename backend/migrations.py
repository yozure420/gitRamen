"""既存 DB 向けの簡易マイグレーション（不足カラムの追加のみ）"""
from sqlalchemy import Boolean, Integer, String, and_, column, inspect, not_, or_, table, update
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import DBAPIError

from playable_commands import PLAYABLE_COMMANDS

# {true} は DB ごとの真偽値リテラルに置き換える（SQLite は 1、PostgreSQL などは TRUE）
COMMAND_COLUMN_MIGRATIONS = {
    "game_note": "ALTER TABLE command ADD COLUMN game_note TEXT",
    "course": "ALTER TABLE command ADD COLUMN course INTEGER NOT NULL DEFAULT 1",
    # 追加直後は全行 true になるので、続けて _mark_unplayable_commands で未実装コマンドを落とす
    "playable": "ALTER TABLE command ADD COLUMN playable BOOLEAN NOT NULL DEFAULT {true}",
}


def _command_columns(engine: Engine) -> set[str]:
    return {info["name"] for info in inspect(engine).get_columns("command")}


def _mark_unplayable_commands(conn: Connection) -> None:
    """playable 列を足した直後に一度だけ、ゲームで操作できないコマンドを playable=false にする

    再シードされないまま運用されても、未実装コマンドがヘルプと出題に出ないようにする。
    """
    command = table("command", column("command", String), column("course", Integer), column("playable", Boolean))
    is_playable = or_(*(
        and_(command.c.course == course, command.c.command.in_(sorted(names)))
        for course, names in PLAYABLE_COMMANDS.items()
    ))
    conn.execute(update(command).where(not_(is_playable)).values(playable=False))


def ensure_schema(engine: Engine) -> None:
    true_literal = "TRUE" if engine.dialect.supports_native_boolean else "1"
    existing = _command_columns(engine)
    for name, ddl in COMMAND_COLUMN_MIGRATIONS.items():
        if name in existing:
            continue
        try:
            with engine.begin() as conn:
                conn.exec_driver_sql(ddl.format(true=true_literal))
                if name == "playable":
                    _mark_unplayable_commands(conn)
        except DBAPIError:
            # 複数ワーカーの同時起動で、他のワーカーが先に追加していた場合は無視する
            if name not in _command_columns(engine):
                raise
