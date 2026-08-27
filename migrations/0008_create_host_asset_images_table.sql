-- Migration number: 0008 	 2026-08-27T22:20:00.000Z

-- Multiple photos per install (install, sticker, location, etc.) instead
-- of the single image_key column from 0007.
CREATE TABLE IF NOT EXISTS host_asset_images (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  host_asset_id  INTEGER NOT NULL REFERENCES host_assets(id),
  image_key      TEXT NOT NULL,
  label          TEXT,
  uploaded_by    TEXT NOT NULL,
  uploaded_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_host_asset_images_host_asset_id ON host_asset_images(host_asset_id);

ALTER TABLE host_assets DROP COLUMN image_key;
