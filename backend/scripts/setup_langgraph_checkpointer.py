"""Tạo/nâng cấp schema PostgresSaver trước khi Gunicorn fork worker.

Chạy bằng ``python -m backend.scripts.setup_langgraph_checkpointer`` trong
container startup. Khi không cấu hình PostgreSQL, script bỏ qua thành công.
Nếu đã cấu hình mà setup lỗi, startup dừng để không chạy nhiều worker với
trạng thái persistence không nhất quán.
"""

from __future__ import annotations

import logging

from langgraph.checkpoint.postgres import Connection, PostgresSaver, dict_row
from langgraph.store.postgres import PostgresStore

from backend.app.config import Settings


def setup_langgraph_checkpointer(settings: Settings | None = None) -> bool:
    settings = settings or Settings.from_env()
    if not settings.database_url:
        logging.getLogger("backend").info("SUPABASE_DATABASE_URL not configured — LangGraph schema setup skipped.")
        return False

    dsn = settings.database_url.replace("+psycopg", "")
    with Connection.connect(
        dsn,
        autocommit=True,
        prepare_threshold=None,
        row_factory=dict_row,
    ) as conn:
        PostgresSaver(conn).setup()

    # Store uses library-managed tables separate from checkpoint tables.  Run
    # setup only in pre-start, never concurrently in Gunicorn workers.
    with Connection.connect(
        dsn,
        autocommit=True,
        prepare_threshold=None,
        row_factory=dict_row,
    ) as conn:
        PostgresStore(conn).setup()
        # LangGraph owns the table schema; this application owns access.  On
        # Supabase, keep Store server-only even when ``public`` is exposed by
        # the Data API.  The DO block remains portable to PostgreSQL instances
        # that do not define Supabase roles.
        conn.execute(
            """
            DO $$
            BEGIN
              IF to_regclass('public.store') IS NOT NULL THEN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                  REVOKE ALL ON TABLE public.store FROM anon;
                END IF;
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                  REVOKE ALL ON TABLE public.store FROM authenticated;
                END IF;
              END IF;
              IF to_regclass('public.store_migrations') IS NOT NULL THEN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                  REVOKE ALL ON TABLE public.store_migrations FROM anon;
                END IF;
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                  REVOKE ALL ON TABLE public.store_migrations FROM authenticated;
                END IF;
              END IF;
            END $$;
            """
        )

    logging.getLogger("backend").info("LangGraph checkpoint and store schemas are ready.")
    return True


if __name__ == "__main__":
    setup_langgraph_checkpointer()
