import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import aiosqlite


DB_PATH = Path(__file__).with_name("database.db")


def _utc_now() -> str:
    """Return a UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


async def init_db() -> None:
    """Ensure all required tables exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS survey_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                survey_data TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        await db.commit()


async def create_session() -> int:
    """Create a new survey session and return its identifier."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO survey_sessions (survey_data, completed_at, updated_at) VALUES (?, ?, ?)",
            (None, None, _utc_now()),
        )
        await db.commit()
        return cursor.lastrowid


async def get_session(session_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve a session record by id."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            SELECT id, survey_data, completed_at, created_at, updated_at
            FROM survey_sessions
            WHERE id = ?
            """,
            (session_id,),
        )
        row = await cursor.fetchone()

    if not row:
        return None

    data = dict(row)
    data["session_id"] = data.pop("id")
    if data.get("survey_data"):
        data["survey_data"] = json.loads(data["survey_data"])
    else:
        data["survey_data"] = None
    return data


async def save_survey_data(session_id: int, survey_payload: Dict[str, Any]) -> bool:
    """Persist survey data for a session. Returns True if a row was updated."""
    serialized = json.dumps(survey_payload)
    timestamp = _utc_now()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            UPDATE survey_sessions
            SET survey_data = ?, completed_at = ?, updated_at = ?
            WHERE id = ?
            """,
            (serialized, timestamp, timestamp, session_id),
        )
        await db.commit()
        return cursor.rowcount > 0
