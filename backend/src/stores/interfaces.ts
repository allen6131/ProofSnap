import type { AnalysisResponsePayload, BackupRecord } from '../types/domain';

export type AnalysisResultRecord = AnalysisResponsePayload & {
  userId: string;
  reportId: string;
  createdAt: string;
};

export interface QuotaUsageStore {
  getUsageForMonth(
    userId: string,
    monthKey: string,
  ): Promise<{ count: number; limit: number }>;
  incrementUsageForMonth(
    userId: string,
    monthKey: string,
    limit: number,
  ): Promise<{ count: number; limit: number }>;
}

export interface AnalysisResultsStore {
  save(
    callbackId: string,
    result: AnalysisResultRecord,
  ): Promise<AnalysisResultRecord>;
  get(callbackId: string): Promise<AnalysisResultRecord | null>;
}

export interface BackupStore {
  put(record: BackupRecord): Promise<{ etag: string; lastModified: string }>;
  get(userId: string, reportId: string): Promise<BackupRecord | null>;
}

export type StoreBundle = {
  quotaUsageStore: QuotaUsageStore;
  analysisResultsStore: AnalysisResultsStore;
  backupStore: BackupStore;
};
