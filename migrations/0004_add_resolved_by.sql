-- Migration number: 0004 	 2026-08-06T02:59:44.846Z

ALTER TABLE deletion_requests ADD COLUMN resolved_by TEXT;
ALTER TABLE edit_requests ADD COLUMN resolved_by TEXT;
