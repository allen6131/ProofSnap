import { getDatabase, initializeDatabase } from '@/db/database';
import { nowIso } from '@/lib/dates';
import type { BrandingSettings, BrandingSettingsPatch } from '@/types/settings';

import { mapBrandingSettingsRow, type BrandingSettingsRow } from './mappers';

const DEFAULT_BRANDING_ID = 'default';

export async function getBrandingSettings(): Promise<BrandingSettings> {
  await initializeDatabase();
  const db = await getDatabase();
  const row = await db.getFirstAsync<BrandingSettingsRow>(
    'SELECT * FROM branding_settings WHERE id = ? LIMIT 1',
    [DEFAULT_BRANDING_ID],
  );

  return mapBrandingSettingsRow(row);
}

export async function saveBrandingSettings(patch: BrandingSettingsPatch): Promise<BrandingSettings> {
  await initializeDatabase();
  const existing = await getBrandingSettings();
  const next: BrandingSettings = {
    ...existing,
    ...patch,
    id: DEFAULT_BRANDING_ID,
    updatedAt: nowIso(),
  };
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO branding_settings (
      id, company_name, contact_name, email, phone, website, logo_uri, footer_text, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      company_name = excluded.company_name,
      contact_name = excluded.contact_name,
      email = excluded.email,
      phone = excluded.phone,
      website = excluded.website,
      logo_uri = excluded.logo_uri,
      footer_text = excluded.footer_text,
      updated_at = excluded.updated_at`,
    [
      next.id,
      next.companyName ?? null,
      next.contactName ?? null,
      next.email ?? null,
      next.phone ?? null,
      next.website ?? null,
      next.logoUri ?? null,
      next.footerText ?? null,
      next.updatedAt ?? nowIso(),
    ],
  );

  return next;
}
