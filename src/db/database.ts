import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';

const DATABASE_NAME = 'proofsnap.db';
export type SqlValue = string | number | null;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializedPromise: Promise<void> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
}

export function initializeDatabase(): Promise<void> {
  initializedPromise ??= getDatabase().then(runMigrations);
  return initializedPromise;
}

export async function runSql<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: SqlValue[] = [],
): Promise<T[]> {
  const db = await getDatabase();
  const normalized = sql.trim().toUpperCase();

  if (normalized.startsWith('SELECT') || normalized.startsWith('PRAGMA')) {
    return db.getAllAsync<T>(sql, params);
  }

  await db.runAsync(sql, params);
  return [];
}

export async function getAll<T>(
  sql: string,
  params: SQLite.SQLiteBindParams = [],
): Promise<T[]> {
  await initializeDatabase();
  const db = await getDatabase();
  return db.getAllAsync<T>(sql, params);
}

export async function getFirst<T>(
  sql: string,
  params: SQLite.SQLiteBindParams = [],
): Promise<T | null> {
  await initializeDatabase();
  const db = await getDatabase();
  return db.getFirstAsync<T>(sql, params);
}

export async function run(
  sql: string,
  params: SQLite.SQLiteBindParams = [],
): Promise<SQLite.SQLiteRunResult> {
  await initializeDatabase();
  const db = await getDatabase();
  return db.runAsync(sql, params);
}
