"""Direct PyMySQL connection to myitnb (bypasses Django MySQL backend MariaDB 10.5+ requirement)."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

import pymysql
from django.conf import settings


def _connection_kwargs() -> dict[str, Any]:
    return {
        "host": settings.MYITNB_DB_HOST,
        "port": int(settings.MYITNB_DB_PORT),
        "user": settings.MYITNB_DB_USER,
        "password": settings.MYITNB_DB_PASSWORD,
        "database": settings.MYITNB_DB_NAME,
        "charset": "utf8mb4",
        "connect_timeout": 5,
        "read_timeout": 10,
    }


@contextmanager
def myitnb_cursor() -> Iterator[pymysql.cursors.Cursor]:
    """Open a read-only cursor to the external myitnb MariaDB (one connection per use)."""
    conn = pymysql.connect(**_connection_kwargs())
    try:
        with conn.cursor() as cursor:
            yield cursor
    finally:
        conn.close()
