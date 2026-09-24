-- Migration number: 0009 	 2026-09-24T18:00:00.000Z

-- Adds the GGG (Longview–Tyler) region. SQLite can't alter a CHECK
-- constraint, so repeaters and edit_requests are rebuilt with the new list
-- (same columns, data and ids). Each table's rows are held aside, the table
-- is dropped and recreated under its own name, and the rows are put back.
-- host_assets.repeater_id references repeaters(id): with foreign keys
-- deferred, dropping repeaters marks linked assets as orphaned and
-- re-inserting the same ids resolves them before commit. (Renaming a copy
-- into place does not, because it never inserts into "repeaters".)

PRAGMA defer_foreign_keys = true;

-- Dropping a table also drops its AUTOINCREMENT counter; keep it so ids of
-- deleted repeaters (still named by resolved requests) are never reused.
CREATE TABLE sequence_hold AS SELECT name, seq FROM sqlite_sequence WHERE name IN ('repeaters', 'edit_requests');

CREATE TABLE repeaters_hold AS SELECT * FROM repeaters;
DROP TABLE repeaters;
CREATE TABLE repeaters (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  public_key     TEXT NOT NULL UNIQUE,
  region         TEXT NOT NULL CHECK (region IN ('AUS','SAT','HOU','DFW','ELP','ABI','AMA','MFE','SJT','TXK','GGG','CRP','ACT')),
  location       TEXT NOT NULL,
  operator_name  TEXT NOT NULL,
  contact_info   TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO repeaters (id, name, public_key, region, location, operator_name, contact_info, created_at)
  SELECT id, name, public_key, region, location, operator_name, contact_info, created_at FROM repeaters_hold;
DROP TABLE repeaters_hold;
CREATE INDEX IF NOT EXISTS idx_repeaters_region ON repeaters(region);

CREATE TABLE edit_requests_hold AS SELECT * FROM edit_requests;
DROP TABLE edit_requests;
CREATE TABLE edit_requests (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  repeater_id    INTEGER NOT NULL,
  name           TEXT NOT NULL,
  public_key     TEXT NOT NULL,
  region         TEXT NOT NULL CHECK (region IN ('AUS','SAT','HOU','DFW','ELP','ABI','AMA','MFE','SJT','TXK','GGG','CRP','ACT')),
  location       TEXT NOT NULL,
  operator_name  TEXT NOT NULL,
  contact_info   TEXT NOT NULL,
  note           TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  requested_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resolved_at    TEXT,
  resolved_by    TEXT
);
INSERT INTO edit_requests (id, repeater_id, name, public_key, region, location, operator_name, contact_info, note, status, requested_at, resolved_at, resolved_by)
  SELECT id, repeater_id, name, public_key, region, location, operator_name, contact_info, note, status, requested_at, resolved_at, resolved_by FROM edit_requests_hold;
DROP TABLE edit_requests_hold;
CREATE INDEX IF NOT EXISTS idx_edit_requests_status ON edit_requests(status);

UPDATE sqlite_sequence SET seq = max(seq, (SELECT h.seq FROM sequence_hold h WHERE h.name = sqlite_sequence.name))
  WHERE name IN (SELECT name FROM sequence_hold);
INSERT INTO sqlite_sequence (name, seq)
  SELECT name, seq FROM sequence_hold WHERE name NOT IN (SELECT name FROM sqlite_sequence);
DROP TABLE sequence_hold;
