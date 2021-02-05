DROP TABLE IF EXISTS tenant_ids;

CREATE TABLE tenant_ids(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  cred_xero_id INTEGER UNIQUE NOT NULL,
  FOREIGN KEY (cred_xero_id) REFERENCES cred_xero (id)
);