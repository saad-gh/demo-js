-- xero organizations, xero currency mapping
DROP TABLE IF EXISTS sage_xero_currency_mapping;
CREATE TABLE sage_xero_currency_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sage_code TEXT UNIQUE NOT NULL,
  xero_code TEXT UNIQUE NOT NULL
);