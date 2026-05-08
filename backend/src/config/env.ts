import dotenv from 'dotenv';

dotenv.config();

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  aiMonthlyQuotaPro: parseNumber(process.env.AI_MONTHLY_QUOTA_PRO, 75),
  aiMonthlyQuotaFree: parseNumber(process.env.AI_MONTHLY_QUOTA_FREE, 0),
  backupEnabledByDefault: parseBoolean(process.env.BACKUP_ENABLED_BY_DEFAULT, true),
  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  backupTableName: process.env.BACKUP_TABLE_NAME ?? 'proofsnap-backups',
  usageTableName: process.env.USAGE_TABLE_NAME ?? 'proofsnap-ai-usage',
  analysisTableName: process.env.ANALYSIS_TABLE_NAME ?? 'proofsnap-analysis-results',
  storeProvider: process.env.STORE_PROVIDER ?? 'memory',
};
