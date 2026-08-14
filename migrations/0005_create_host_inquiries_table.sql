-- Migration number: 0005 	 2026-08-14T00:00:00.000Z

CREATE TABLE IF NOT EXISTS host_inquiries (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL,
  address        TEXT,
  roof_height    TEXT,
  message        TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
