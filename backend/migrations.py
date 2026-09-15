"""既存 SQLite DB 向けの簡易マイグレーション（不足カラムの追加のみ）"""
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

COMMAND_COLUMN_MIGRATIONS = {
    "game_note": "ALTER TABLE command ADD COLUMN game_note TEXT",
    "course": "ALTER TABLE command ADD COLUMN course INTEGER NOT NULL DEFAULT 1",
    # 既存DBは再シードされるまで従来どおり全コマンドを表示する
    "playable": "ALTER TABLE command ADD COLUMN playable BOOLEAN NOT NULL DEFAULT 1",
}


def ensure_schema(engine: Engine) -> None:
    with engine.connect() as conn:
        columns = conn.exec_driver_sql("PRAGMA table_info(command)").fetchall()
        column_names = {col[1] for col in columns}
        for column, ddl in COMMAND_COLUMN_MIGRATIONS.items():
            if column in column_names:
                continue
            try:
                conn.exec_driver_sql(ddl)
                conn.commit()
            except OperationalError as exc:
                if "duplicate column name" not in str(exc).lower():
                    raise
