CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    permanent_account INTEGER NOT NULL,
    username TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    salt TEXT NOT NULL
);


CREATE TABLE data_property (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER NOT NULL,
    property_name TEXT NOT NULL,
    property_value TEXT NOT NULL,
    property_data_type TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    message CLOB,
    sequence INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);