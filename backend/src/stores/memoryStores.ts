import { createHash } from 'crypto';

import type {
  AnalysisResultsStore,
  AnalysisResultRecord,
  BackupStore,
  QuotaUsageStore,
} from './interfaces';
import type { BackupRecord } from '../types/domain';

export class InMemoryQuotaUsageStore implements QuotaUsageStore {
  private readonly usage = new Map<string, { count: number; limit: number }>();

  async getUsageForMonth(userId: string, monthKey: string): Promise<{ count: number; limit: number }> {
    return this.usage.get(`${userId}:${monthKey}`) ?? { count: 0, limit: 0 };
  }

  async incrementUsageForMonth(
    userId: string,
    monthKey: string,
    limit: number,
  ): Promise<{ count: number; limit: number }> {
    const key = `${userId}:${monthKey}`;
    const current = this.usage.get(key) ?? { count: 0, limit };
    const next = { count: current.count + 1, limit };
    this.usage.set(key, next);
    return next;
  }
}

export class InMemoryAnalysisResultsStore implements AnalysisResultsStore {
  private readonly records = new Map<string, AnalysisResultRecord>();

  async save(callbackId: string, result: AnalysisResultRecord): Promise<AnalysisResultRecord> {
    this.records.set(callbackId, result);
    return result;
  }

  async get(callbackId: string): Promise<AnalysisResultRecord | null> {
    return this.records.get(callbackId) ?? null;
  }
}

export class InMemoryBackupStore implements BackupStore {
  private readonly records = new Map<string, BackupRecord>();

  async put(record: BackupRecord): Promise<{ etag: string; lastModified: string }> {
    const lastModified = new Date().toISOString();
    const persisted: BackupRecord = { ...record, updatedAt: lastModified };
    this.records.set(`${record.userId}:${record.reportId}`, persisted);
    const etag = createHash('sha1')
      .update(`${record.userId}:${record.reportId}:${record.timestamp}:${record.encryptedBlob}`)
      .digest('hex');
    return { etag, lastModified };
  }

  async get(userId: string, reportId: string): Promise<BackupRecord | null> {
    return this.records.get(`${userId}:${reportId}`) ?? null;
  }
}
