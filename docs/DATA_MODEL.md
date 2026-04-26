# ProofPack Data Model

## SQLite tables
Use migrations. Keep migration code idempotent.

### reports
```sql
CREATE TABLE IF NOT EXISTS reports (
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
);
```

### report_photos
```sql
CREATE TABLE IF NOT EXISTS report_photos (
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
);
```

### branding_settings
```sql
CREATE TABLE IF NOT EXISTS branding_settings (
  id TEXT PRIMARY KEY NOT NULL,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_uri TEXT,
  footer_text TEXT,
  updated_at TEXT NOT NULL
);
```

### app_settings
```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
```

## TypeScript types
Create matching TypeScript types in `src/types` or feature folders.

```ts
export type ReportStatus = 'draft' | 'completed' | 'archived';

export interface Report {
  id: string;
  title: string;
  templateId?: string | null;
  clientName?: string | null;
  propertyName?: string | null;
  address?: string | null;
  generalNotes?: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface ReportPhoto {
  id: string;
  reportId: string;
  localUri: string;
  fileName?: string | null;
  caption?: string | null;
  sectionLabel?: string | null;
  takenAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  createdAt: string;
  sortOrder: number;
}
```

## Repository functions
Create repository functions similar to:

- `createReport(input)`
- `updateReport(id, patch)`
- `getReport(id)`
- `listReports()`
- `deleteReport(id)`
- `addPhotoToReport(reportId, photoInput)`
- `updateReportPhoto(id, patch)`
- `deleteReportPhoto(id)`
- `listReportPhotos(reportId)`
- `getBrandingSettings()`
- `saveBrandingSettings(patch)`

## File storage policy
- Store imported/captured images under an app documents directory, for example `reports/{reportId}/photos/{photoId}.jpg`.
- Store generated PDFs under `reports/{reportId}/exports/`.
- Deleting a report should delete its local photo/PDF files when feasible.
- The app should tolerate missing files and show a friendly missing-image state.

