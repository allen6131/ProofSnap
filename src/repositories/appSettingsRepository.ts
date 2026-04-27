import { getDatabase, initializeDatabase } from '@/db/database';

export async function getAppSetting(key: string): Promise<string | null> {
  await initializeDatabase();
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await initializeDatabase();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function deleteAppSetting(key: string): Promise<void> {
  await initializeDatabase();
  const db = await getDatabase();
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', [key]);
}
