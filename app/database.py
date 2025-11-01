import pathlib

from typing import Literal

import aiosqlite
import bcrypt

DB_PATH = pathlib.Path(__file__).parent / "database.db"


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


async def insert_message(
    conn: aiosqlite.Connection,
    role: Literal["user", "assistant"],
    message: str,
    user_id: int,
) -> None:
    """Saves the message

    Args:
        conn (aiosqlite.Connection): the database connection object
        role (Literal["user", "assistant"]): who sent the message
        message (str): the message to be saved
        user_id (int): the id of the user id to alter
    """
    cursor = await conn.execute(
        """
        SELECT MAX(sequence) FROM messages WHERE user_id = ?                            
    """,
        (user_id,),
    )

    sequence = (await cursor.fetchone())[0]

    if not sequence:
        sequence = 0

    cursor = await cursor.execute(
        """
        INSERT INTO messages (user_id, role, message, sequence)
        VALUES (?, ?, ?, ?)
    """,
        (
            user_id,
            role,
            message,
            sequence + 1,
        ),
    )

    await conn.commit()


async def get_messages(conn: aiosqlite.Connection, user_id: int) -> list[dict]:
    messages = []

    cursor = await conn.execute(
        """
        SELECT * FROM messages WHERE user_id = ? ORDER BY sequence ASC                            
    """,
        (user_id,),
    )

    message_rows = await cursor.fetchall()

    for message_row in message_rows:
        messages.append({"role": message_row[2], "content": [{"text": message_row[3]}]})

    return messages


async def main():
    conn = await get_db()
    print(await get_messages(conn, 1))
    await close_db(conn)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
