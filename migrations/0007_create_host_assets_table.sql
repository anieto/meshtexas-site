-- Migration number: 0007 	 2026-08-27T21:55:00.000Z

CREATE TABLE IF NOT EXISTS host_assets (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_number             INTEGER NOT NULL UNIQUE,
  repeater_id              INTEGER REFERENCES repeaters(id),
  contact_name             TEXT,
  contact_phone            TEXT,
  business_name            TEXT,
  building_address         TEXT,
  roof_height              TEXT,
  parapet_height           TEXT,
  roof_access_method       TEXT,
  installed_date           TEXT,
  installer_name           TEXT,
  installer_phone          TEXT,
  sarc_manager             TEXT,
  node_type                TEXT,
  antenna_type             TEXT,
  mounting_method          TEXT,
  battery_type             TEXT,
  solar_charge_controller  TEXT,
  solar_panel              TEXT,
  image_key                TEXT,
  created_by               TEXT NOT NULL,
  created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by               TEXT,
  updated_at               TEXT
);

CREATE INDEX IF NOT EXISTS idx_host_assets_asset_number ON host_assets(asset_number);
CREATE INDEX IF NOT EXISTS idx_host_assets_node_type ON host_assets(node_type);
CREATE INDEX IF NOT EXISTS idx_host_assets_antenna_type ON host_assets(antenna_type);
CREATE INDEX IF NOT EXISTS idx_host_assets_battery_type ON host_assets(battery_type);
