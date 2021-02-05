-- Drop any existing data and create empty tables.

DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS cred_app;
DROP TABLE IF EXISTS cred_xero;
DROP TABLE IF EXISTS cred_sage;

CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE cred_app (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect TEXT NOT NULL,
  user_id INTEGER UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user (id)
);

CREATE TABLE cred_xero (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_token TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_received TEXT NOT NULL,
  user_id INTEGER UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user (id)
);

-- CREATE TABLE cred_sage (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     username TEXT NOT NULL,
--     password TEXT NOT NULL,
--     server TEXT NOT NULL,
--     port INTEGER,
--     user_id INTEGER UNIQUE NOT NULL,
--     FOREIGN KEY (user_id) REFERENCES user (id)
-- );

-- -- Sage invoice reference
-- CREATE TABLE sage_reference (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   accrec TEXT UNIQUE,
--   accpay TEXT UNIQUE
-- );

-- -- Sage table types
-- CREATE TABLE sage_table_types (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL
-- );

-- -- Sage table
-- CREATE TABLE sage_tables (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL,
--   id_type INTEGER NOT NULL,
--   FOREIGN KEY (id_type) REFERENCES sage_table_types (id)
-- );

-- -- Fields correspond to MSSQL database
-- CREATE TABLE sage_fields (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   id_table TEXT NOT NULL,
--   field TEXT NOT NULL,
--   FOREIGN KEY (id_table) REFERENCES sage_tables (id)
-- );

-- -- End points XERO
-- CREATE TABLE xero_end_points (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL
-- );

-- -- Fields correspond to XERO API
-- CREATE TABLE xero_fields (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   id_end_point TEXT NOT NULL,
--   field TEXT NOT NULL,
--   FOREIGN KEY (id_end_point) REFERENCES (xero_end_points)
-- );

-- CREATE TABLE map_sage_xero (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   id_field_xero INTEGER NOT NULL,
--   id_field_sage INTEGER NOT NULL,
--   FOREIGN KEY (id_field_xero) REFERENCES xero_fields (id),
--   FOREIGN KEY (id_field_sage) REFERENCES sage_fields (id)
-- );