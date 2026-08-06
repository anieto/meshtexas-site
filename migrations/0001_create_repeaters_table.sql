-- Migration number: 0001 	 2026-08-06T00:55:05.532Z

CREATE TABLE IF NOT EXISTS repeaters (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  public_key     TEXT NOT NULL UNIQUE,
  region         TEXT NOT NULL CHECK (region IN ('AUS','SAT','HOU','DFW','ELP','ABI','AMA','MFE','SJT','TXK','CRP','ACT')),
  location       TEXT NOT NULL,
  operator_name  TEXT NOT NULL,
  contact_info   TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_repeaters_region ON repeaters(region);
