from sqlalchemy import create_engine
from sqlalchemy.dialects import postgresql, sqlite
from sqlalchemy.schema import CreateTable

from migrations import ensure_schema
from models import Cmd


def _columns(engine):
    with engine.connect() as conn:
        return {row[1]: row for row in conn.exec_driver_sql("PRAGMA table_info(command)").fetchall()}


def test_ensure_schema_adds_missing_columns_to_legacy_table(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}")
    with engine.connect() as conn:
        conn.exec_driver_sql("CREATE TABLE command (id INTEGER PRIMARY KEY, command VARCHAR(100), description TEXT)")
        conn.exec_driver_sql("INSERT INTO command (command, description) VALUES ('git status', 'd')")
        conn.commit()

    ensure_schema(engine)

    assert {"game_note", "course", "playable"} <= set(_columns(engine))
    with engine.connect() as conn:
        course, playable = conn.exec_driver_sql("SELECT course, playable FROM command").one()
    # 再シード前の既存データは従来どおり表示されるよう、コース1・playable 扱いになる
    assert (course, playable) == (1, 1)


def test_ensure_schema_is_idempotent(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'twice.db').as_posix()}")
    with engine.connect() as conn:
        conn.exec_driver_sql("CREATE TABLE command (id INTEGER PRIMARY KEY, command VARCHAR(100))")
        conn.commit()

    ensure_schema(engine)
    ensure_schema(engine)

    assert list(_columns(engine)) == ["id", "command", "game_note", "course", "playable"]


def test_playable_default_is_rendered_per_dialect():
    """SQLite 以外でも通る既定値になっている（PostgreSQL は BOOLEAN の既定値に 1 を受け付けない）"""
    create_table = CreateTable(Cmd.__table__)

    assert "playable BOOLEAN DEFAULT true NOT NULL" in str(create_table.compile(dialect=postgresql.dialect()))
    assert "playable BOOLEAN DEFAULT (1) NOT NULL" in str(create_table.compile(dialect=sqlite.dialect()))
