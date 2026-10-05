import pytest
from sqlalchemy import create_engine
from sqlalchemy.dialects import postgresql, sqlite
from sqlalchemy.exc import OperationalError
from sqlalchemy.schema import CreateTable

import migrations
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
    # 再シード前の既存データはコース1扱いになり、ゲームで操作できるコマンドは playable のまま
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


def _playable_by_command(engine):
    with engine.connect() as conn:
        return dict(conn.exec_driver_sql("SELECT command, playable FROM command").fetchall())


def test_ensure_schema_hides_unimplemented_commands_when_adding_playable(tmp_path):
    """再シードしていない既存 DB でも、未実装コマンドがヘルプと出題に出ない"""
    engine = create_engine(f"sqlite:///{(tmp_path / 'no-playable.db').as_posix()}")
    with engine.connect() as conn:
        conn.exec_driver_sql("CREATE TABLE command (id INTEGER PRIMARY KEY, command VARCHAR(100), course INTEGER NOT NULL DEFAULT 1)")
        conn.exec_driver_sql(
            "INSERT INTO command (command, course) VALUES "
            "('git status', 1), ('git init', 1), ('git merge <branch>', 1), "
            "('git stash', 2), ('git rebase <branch>', 2), ('git stash', 1)"
        )
        conn.commit()

    ensure_schema(engine)

    with engine.connect() as conn:
        rows = conn.exec_driver_sql("SELECT command, course, playable FROM command ORDER BY id").fetchall()
    assert [tuple(row) for row in rows] == [
        ("git status", 1, 1),
        ("git init", 1, 0),
        ("git merge <branch>", 1, 0),
        ("git stash", 2, 1),
        ("git rebase <branch>", 2, 0),
        # 表記が同じでも、そのコースで操作できないものは対象外
        ("git stash", 1, 0),
    ]


def test_ensure_schema_keeps_playable_values_of_migrated_db(tmp_path):
    """playable 列が既にある DB（シード済みなど）の値は書き換えない"""
    engine = create_engine(f"sqlite:///{(tmp_path / 'migrated.db').as_posix()}")
    with engine.connect() as conn:
        conn.exec_driver_sql(
            "CREATE TABLE command (id INTEGER PRIMARY KEY, command VARCHAR(100), game_note TEXT, "
            "course INTEGER NOT NULL DEFAULT 1, playable BOOLEAN NOT NULL DEFAULT 1)"
        )
        conn.exec_driver_sql("INSERT INTO command (command, course, playable) VALUES ('git init', 1, 1), ('git status', 1, 0)")
        conn.commit()

    ensure_schema(engine)

    assert _playable_by_command(engine) == {"git init": 1, "git status": 0}


def _legacy_engine_without_playable(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}")
    with engine.connect() as conn:
        conn.exec_driver_sql("CREATE TABLE command (id INTEGER PRIMARY KEY, command VARCHAR(100), game_note TEXT, course INTEGER NOT NULL DEFAULT 1)")
        conn.exec_driver_sql("INSERT INTO command (command, course) VALUES ('git status', 1), ('git init', 1), (NULL, 1)")
        conn.commit()
    return engine


def test_ensure_schema_hides_rows_without_command(tmp_path):
    engine = _legacy_engine_without_playable(tmp_path)

    ensure_schema(engine)

    with engine.connect() as conn:
        rows = conn.exec_driver_sql("SELECT command, playable FROM command ORDER BY id").fetchall()
    assert [tuple(row) for row in rows] == [("git status", 1), ("git init", 0), (None, 0)]


def test_ensure_schema_rolls_back_column_when_playable_update_fails(tmp_path, monkeypatch):
    """更新に失敗したら列の追加ごと取り消す（列だけ残ると、次回の起動で更新がやり直されない）"""
    engine = _legacy_engine_without_playable(tmp_path)

    def fail(_conn):
        raise OperationalError("UPDATE command", {}, Exception("database is locked"))

    with monkeypatch.context() as patched:
        patched.setattr(migrations, "_mark_unplayable_commands", fail)
        with pytest.raises(OperationalError):
            ensure_schema(engine)
    assert "playable" not in _columns(engine)

    ensure_schema(engine)

    assert _playable_by_command(engine)["git init"] == 0


def test_ensure_schema_ignores_column_added_by_another_worker(tmp_path, monkeypatch):
    """列を調べたあとに他のワーカーが同じ列を追加していても、起動を止めない"""
    engine = _legacy_engine_without_playable(tmp_path)
    monkeypatch.setattr(migrations, "_command_columns", lambda _engine, calls=[]: (
        calls.append(1) or (set() if len(calls) == 1 else set(_columns(engine)))
    ))

    ensure_schema(engine)

    assert {"game_note", "course", "playable"} <= set(_columns(engine))
