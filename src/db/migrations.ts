import type { SQLiteDatabase } from 'expo-sqlite';

const migrations = [
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    template_id TEXT,
    client_name TEXT,
    property_name TEXT,
    address TEXT,
    general_notes TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS report_photos (
    id TEXT PRIMARY KEY NOT NULL,
    report_id TEXT NOT NULL,
    local_uri TEXT NOT NULL,
    file_name TEXT,
    caption TEXT,
    section_label TEXT,
    taken_at TEXT,
    latitude REAL,
    longitude REAL,
    location_accuracy REAL,
    created_at TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS branding_settings (
    id TEXT PRIMARY KEY NOT NULL,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    logo_uri TEXT,
    footer_text TEXT,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_reports_updated_at ON reports(updated_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_report_photos_report_id_sort ON report_photos(report_id, sort_order);`,
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  for (const migration of migrations) {
    await db.execAsync(migration);
  }
}
