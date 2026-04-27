import { getDatabase, initializeDatabase } from '@/db/database';
import { nowIso } from '@/lib/dates';
import { createId } from '@/lib/ids';
import type { CreateReportPhotoInput, ReportPhoto, UpdateReportPhotoInput } from '@/types/photo';

import { mapReportPhotoRow, type ReportPhotoRow } from './mappers';

export async function addPhotoToReport(
  reportId: string,
  input: CreateReportPhotoInput,
): Promise<ReportPhoto> {
  await initializeDatabase();
  const db = await getDatabase();
  const timestamp = nowIso();
  const maxRow = await db.getFirstAsync<{ max_sort_order: number | null }>(
    'SELECT MAX(sort_order) AS max_sort_order FROM report_photos WHERE report_id = ?',
    [reportId],
  );
  const photo: ReportPhoto = {
    id: createId(),
    reportId,
    localUri: input.localUri,
    fileName: input.fileName ?? null,
    caption: input.caption ?? null,
    sectionLabel: input.sectionLabel ?? null,
    takenAt: input.takenAt ?? timestamp,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    locationAccuracy: input.locationAccuracy ?? null,
    createdAt: timestamp,
    sortOrder: input.sortOrder ?? Number(maxRow?.max_sort_order ?? -1) + 1,
  };
  const params = [
    photo.id,
    photo.reportId,
    photo.localUri,
    photo.fileName ?? null,
    photo.caption ?? null,
    photo.sectionLabel ?? null,
    photo.takenAt ?? null,
    photo.latitude ?? null,
    photo.longitude ?? null,
    photo.locationAccuracy ?? null,
    photo.createdAt,
    photo.sortOrder,
  ];

  await db.runAsync(
    `INSERT INTO report_photos (
      id, report_id, local_uri, file_name, caption, section_label, taken_at, latitude,
      longitude, location_accuracy, created_at, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params,
  );
  await db.runAsync('UPDATE reports SET updated_at = ? WHERE id = ?', [timestamp, reportId]);

  return photo;
}

export async function getReportPhoto(id: string): Promise<ReportPhoto | null> {
  await initializeDatabase();
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReportPhotoRow>('SELECT * FROM report_photos WHERE id = ?', [
    id,
  ]);
  return row ? mapReportPhotoRow(row) : null;
}

export async function listReportPhotos(reportId: string): Promise<ReportPhoto[]> {
  await initializeDatabase();
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportPhotoRow>(
    'SELECT * FROM report_photos WHERE report_id = ? ORDER BY sort_order ASC, created_at ASC',
    [reportId],
  );
  return rows.map(mapReportPhotoRow);
}

export async function updateReportPhoto(
  id: string,
  patch: UpdateReportPhotoInput,
): Promise<ReportPhoto | null> {
  await initializeDatabase();
  const existing = await getReportPhoto(id);
  if (!existing) {
    return null;
  }

  const next: ReportPhoto = { ...existing, ...patch };
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE report_photos SET
      local_uri = ?,
      file_name = ?,
      caption = ?,
      section_label = ?,
      taken_at = ?,
      latitude = ?,
      longitude = ?,
      location_accuracy = ?,
      sort_order = ?
    WHERE id = ?`,
    [
      next.localUri,
      next.fileName ?? null,
      next.caption ?? null,
      next.sectionLabel ?? null,
      next.takenAt ?? null,
      next.latitude ?? null,
      next.longitude ?? null,
      next.locationAccuracy ?? null,
      next.sortOrder,
      id,
    ],
  );
  await db.runAsync('UPDATE reports SET updated_at = ? WHERE id = ?', [nowIso(), next.reportId]);

  return next;
}

export async function deleteReportPhoto(id: string): Promise<void> {
  await initializeDatabase();
  const existing = await getReportPhoto(id);
  const db = await getDatabase();
  await db.runAsync('DELETE FROM report_photos WHERE id = ?', [id]);
  if (existing) {
    await db.runAsync('UPDATE reports SET updated_at = ? WHERE id = ?', [nowIso(), existing.reportId]);
  }
}

export async function moveReportPhoto(id: string, direction: 'up' | 'down'): Promise<ReportPhoto | null> {
  await initializeDatabase();
  const existing = await getReportPhoto(id);
  if (!existing) {
    return null;
  }

  const db = await getDatabase();
  const operator = direction === 'up' ? '<' : '>';
  const order = direction === 'up' ? 'DESC' : 'ASC';
  const neighbor = await db.getFirstAsync<ReportPhotoRow>(
    `SELECT * FROM report_photos
     WHERE report_id = ? AND sort_order ${operator} ?
     ORDER BY sort_order ${order}
     LIMIT 1`,
    [existing.reportId, existing.sortOrder],
  );

  if (!neighbor) {
    return null;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE report_photos SET sort_order = ? WHERE id = ?', [
      neighbor.sort_order,
      existing.id,
    ]);
    await db.runAsync('UPDATE report_photos SET sort_order = ? WHERE id = ?', [
      existing.sortOrder,
      neighbor.id,
    ]);
    await db.runAsync('UPDATE reports SET updated_at = ? WHERE id = ?', [nowIso(), existing.reportId]);
  });

  return getReportPhoto(id);
}

export function moveReportPhotoUp(id: string): Promise<ReportPhoto | null> {
  return moveReportPhoto(id, 'up');
}

export function moveReportPhotoDown(id: string): Promise<ReportPhoto | null> {
  return moveReportPhoto(id, 'down');
}
