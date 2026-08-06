-- Migration number: 0003 	 2026-08-06T02:25:29.119Z

CREATE TABLE IF NOT EXISTS edit_requests (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  repeater_id    INTEGER NOT NULL,
  name           TEXT NOT NULL,
  public_key     TEXT NOT NULL,
  region         TEXT NOT NULL CHECK (region IN ('AUS','SAT','HOU','DFW','ELP','ABI','AMA','MFE','SJT','TXK','CRP','ACT')),
  location       TEXT NOT NULL,
  operator_name  TEXT NOT NULL,
  contact_info   TEXT NOT NULL,
  note           TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  requested_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resolved_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_edit_requests_status ON edit_requests(status);
