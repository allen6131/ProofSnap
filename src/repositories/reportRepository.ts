import { getDatabase, initializeDatabase } from '@/db/database';
import { createId } from '@/lib/ids';
import { nowIso } from '@/lib/dates';
import type { CreateReportInput, Report, ReportWithPhotoCount, UpdateReportInput } from '@/types/report';

import { mapReportListRow, mapReportRow, type ReportListRow, type ReportRow } from './mappers';

export async function createReport(input: CreateReportInput): Promise<Report> {
  await initializeDatabase();
  const timestamp = nowIso();
  const report: Report = {
    id: createId(),
    title: input.title.trim(),
    templateId: input.templateId ?? null,
    clientName: input.clientName ?? null,
    propertyName: input.propertyName ?? null,
    address: input.address ?? null,
    generalNotes: input.generalNotes ?? null,
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };

  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO reports (
      id, title, template_id, client_name, property_name, address, general_notes, status,
      created_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      report.id,
      report.title,
      report.templateId ?? null,
      report.clientName ?? null,
      report.propertyName ?? null,
      report.address ?? null,
      report.generalNotes ?? null,
      report.status,
      report.createdAt,
      report.updatedAt,
      report.completedAt ?? null,
    ],
  );

  return report;
}

export async function updateReport(id: string, patch: UpdateReportInput): Promise<Report | null> {
  await initializeDatabase();
  const existing = await getReport(id);
  if (!existing) {
    return null;
  }

  const next: Report = {
    ...existing,
    ...patch,
    title: patch.title === undefined ? existing.title : patch.title.trim(),
    updatedAt: nowIso(),
    completedAt:
      patch.status === 'completed' && !existing.completedAt
        ? nowIso()
        : patch.status === 'draft'
          ? null
          : (patch.completedAt ?? existing.completedAt),
  };

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE reports SET
      title = ?,
      template_id = ?,
      client_name = ?,
      property_name = ?,
      address = ?,
      general_notes = ?,
      status = ?,
      updated_at = ?,
      completed_at = ?
    WHERE id = ?`,
    [
      next.title,
      next.templateId ?? null,
      next.clientName ?? null,
      next.propertyName ?? null,
      next.address ?? null,
      next.generalNotes ?? null,
      next.status,
      next.updatedAt,
      next.completedAt ?? null,
      id,
    ],
  );

  return next;
}

export async function getReport(id: string): Promise<Report | null> {
  await initializeDatabase();
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReportRow>('SELECT * FROM reports WHERE id = ? LIMIT 1', [id]);

  return row ? mapReportRow(row) : null;
}

export async function listReports(): Promise<ReportWithPhotoCount[]> {
  await initializeDatabase();
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportListRow>(
    `SELECT reports.*, COUNT(report_photos.id) AS photo_count
     FROM reports
     LEFT JOIN report_photos ON report_photos.report_id = reports.id
     WHERE reports.status != 'archived'
     GROUP BY reports.id
     ORDER BY reports.updated_at DESC`,
  );
  return rows.map(mapReportListRow);
}

export async function countReportsCreatedInMonth(monthKey: string): Promise<number> {
  await initializeDatabase();
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM reports WHERE substr(created_at, 1, 7) = ?`,
    [monthKey],
  );
  return Number(row?.count ?? 0);
}

export async function deleteReport(id: string): Promise<void> {
  await initializeDatabase();
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
}

export async function archiveReport(id: string): Promise<void> {
  await updateReport(id, { status: 'archived' });
}
