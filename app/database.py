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

async def get_db() -> aiosqlite.Connection:
    """Returns a database connection

    Returns:
        aiosqlite.Connection: the database connection
    """
    conn = await aiosqlite.connect(str(DB_PATH))
    return conn


async def close_db(conn: aiosqlite.Connection) -> None:
    """Closes the database connection

    Args:
        conn (aiosqlite.Connection): the database connection object
    """
    await conn.close()


async def load_schema(
    conn: aiosqlite.Connection, schema_path: str = str(DB_PATH.parent / "schema.sql")
) -> None:
    """Loads the schema from the schema file

    Args:
        conn (aiosqlite.Connection): the database connection
        schema_path (str, optional): the path to the schema file. Defaults to str(DB_PATH.parent / "schema.sql").
    """
    with open(schema_path) as f:
        commands = f.read()
    for command in commands.split(";"):
        await conn.execute(command)
    await conn.commit()


async def create_user(conn: aiosqlite.Connection, username: str, password: str) -> int:
    """Adds a new user to the database

    Args:
        conn (aiosqlite.Connection): the database connection object
        username (str): the username
        password (str): the unhashed password

    Returns:
        int: the id of the new user entry
    """
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode(), salt)
    cursor = await conn.execute(
        """
        INSERT INTO users (permanent_account, username, hashed_password, salt)
        VALUES (?, ?, ?, ?)
    """,
        (
            0,  # 0 for false
            username,
            hashed_password,
            salt,
        ),
    )

    await conn.commit()
    await cursor.close()
    return cursor.lastrowid


async def verify_user(
    conn: aiosqlite.Connection, username: str, password: str, user_id: int
) -> None:
    """Makes a permanent user row to the database

    Args:
        conn (aiosqlite.Connection): the database connection object
        username (str): the username
        password (str): the unhashed password
        user_id (int): the id of the user id to alter
    """
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode(), salt)
    await conn.execute(
        """
        UPDATE users
        SET permanent_account = ?, username = ?, hashed_password = ?, salt = ?
        WHERE id=?;
    """,
        (
            1,  # 1 for true
            username,
            hashed_password,
            salt,
            user_id,
        ),
    )

    await conn.commit()
