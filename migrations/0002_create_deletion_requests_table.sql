-- Migration number: 0002 	 2026-08-06T01:20:42.237Z

CREATE TABLE IF NOT EXISTS deletion_requests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  repeater_id   INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  requested_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resolved_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
