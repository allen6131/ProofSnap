import { env } from '../config/env';
import type { StoreBundle } from './interfaces';
import { InMemoryAnalysisResultsStore, InMemoryBackupStore, InMemoryQuotaUsageStore } from './memoryStores';

let cachedStores: StoreBundle | null = null;

const buildStores = (): StoreBundle => {
  if (env.storeProvider === 'dynamo') {
    const { DynamoAnalysisResultsStore, DynamoBackupStore, DynamoQuotaUsageStore } = require('./dynamoStores') as typeof import('./dynamoStores');
    return {
      quotaUsageStore: new DynamoQuotaUsageStore(),
      analysisResultsStore: new DynamoAnalysisResultsStore(),
      backupStore: new DynamoBackupStore(),
    };
  }

  return {
    quotaUsageStore: new InMemoryQuotaUsageStore(),
    analysisResultsStore: new InMemoryAnalysisResultsStore(),
    backupStore: new InMemoryBackupStore(),
  };
};

export const getStores = (): StoreBundle => {
  if (cachedStores) {
    return cachedStores;
  }
  cachedStores = buildStores();
  return cachedStores;
};

export const resetStoresForTests = (): void => {
  cachedStores = null;
};
