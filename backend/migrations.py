"""既存 DB 向けの簡易マイグレーション（不足カラムの追加のみ）"""
from sqlalchemy import Boolean, Integer, String, and_, column, inspect, not_, or_, table, update
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import OperationalError, ProgrammingError

from playable_commands import PLAYABLE_COMMANDS

# {true} は DB ごとの真偽値リテラルに置き換える（SQLite は 1、PostgreSQL などは TRUE）
COMMAND_COLUMN_MIGRATIONS = {
    "game_note": "ALTER TABLE command ADD COLUMN game_note TEXT",
    "course": "ALTER TABLE command ADD COLUMN course INTEGER NOT NULL DEFAULT 1",
    # 追加直後は全行 true になるので、同じトランザクションで未実装コマンドを落とす
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
    # command が NULL の行は比較結果が NULL になり NOT でも拾えないので、別に指定する
    conn.execute(update(command).where(or_(command.c.command.is_(None), not_(is_playable))).values(playable=False))


def _add_column(engine: Engine, name: str, ddl: str) -> None:
    """列の追加と、それに続くデータの更新を 1 つのトランザクションで確定する

    pysqlite は DDL の前に BEGIN を出さず ALTER が即座に確定するため、自分で BEGIN / COMMIT を出す。
    更新が失敗したら列の追加ごと取り消し、次回の起動でやり直せるようにする。
    """
    begin = "BEGIN IMMEDIATE" if engine.dialect.name == "sqlite" else "BEGIN"
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.exec_driver_sql(begin)
        try:
            conn.exec_driver_sql(ddl)
            if name == "playable":
                _mark_unplayable_commands(conn)
            conn.exec_driver_sql("COMMIT")
        except BaseException:
            conn.exec_driver_sql("ROLLBACK")
            raise


def ensure_schema(engine: Engine) -> None:
    true_literal = "TRUE" if engine.dialect.supports_native_boolean else "1"
    existing = _command_columns(engine)
    for name, ddl in COMMAND_COLUMN_MIGRATIONS.items():
        if name in existing:
            continue
        try:
            _add_column(engine, name, ddl.format(true=true_literal))
        except (OperationalError, ProgrammingError):
            # 複数ワーカーの同時起動で、他のワーカーが先に追加していた場合は無視する
            if name not in _command_columns(engine):
                raise
