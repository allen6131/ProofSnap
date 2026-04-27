import { createHash } from 'crypto';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { env } from '../config/env';
import type { AnalysisResponsePayload, BackupRecord } from '../types/domain';
import type {
  AnalysisResultRecord,
  AnalysisResultsStore,
  BackupStore,
  QuotaUsageStore,
} from './interfaces';

const client = new DynamoDBClient({ region: env.awsRegion });
const docClient = DynamoDBDocumentClient.from(client);

const makeEtag = (value: string): string => createHash('sha1').update(value).digest('hex');

export class DynamoQuotaUsageStore implements QuotaUsageStore {
  async getUsageForMonth(userId: string, monthKey: string): Promise<{ count: number; limit: number }> {
    const response = await docClient.send(
      new GetCommand({
        TableName: env.usageTableName,
        Key: { userId, monthKey },
      }),
    );

    return {
      count: Number(response.Item?.count ?? 0),
      limit: Number(response.Item?.limit ?? 0),
    };
  }

  async incrementUsageForMonth(
    userId: string,
    monthKey: string,
    limit: number,
  ): Promise<{ count: number; limit: number }> {
    const response = await docClient.send(
      new UpdateCommand({
        TableName: env.usageTableName,
        Key: { userId, monthKey },
        UpdateExpression: 'SET #limit = if_not_exists(#limit, :limit) ADD #count :inc',
        ExpressionAttributeNames: {
          '#count': 'count',
          '#limit': 'limit',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':limit': limit,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    return {
      count: Number(response.Attributes?.count ?? 0),
      limit: Number(response.Attributes?.limit ?? limit),
    };
  }
}

export class DynamoAnalysisResultsStore implements AnalysisResultsStore {
  async save(callbackId: string, result: AnalysisResultRecord): Promise<AnalysisResultRecord> {
    await docClient.send(
      new PutCommand({
        TableName: env.analysisTableName,
        Item: {
          callbackId,
          ...result,
        },
      }),
    );
    return result;
  }

  async get(callbackId: string): Promise<AnalysisResultRecord | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: env.analysisTableName,
        Key: { callbackId },
      }),
    );
    if (!response.Item) {
      return null;
    }
    const item = response.Item as AnalysisResponsePayload & {
      userId: string;
      reportId: string;
      createdAt: string;
    };
    return {
      ...item,
    };
  }
}

export class DynamoBackupStore implements BackupStore {
  async put(record: BackupRecord): Promise<{ etag: string; lastModified: string }> {
    const lastModified = record.updatedAt;
    const etag = makeEtag(`${record.userId}:${record.reportId}:${record.encryptedBlob}:${lastModified}`);

    await docClient.send(
      new PutCommand({
        TableName: env.backupTableName,
        Item: {
          ...record,
          etag,
          lastModified,
        },
      }),
    );

    return { etag, lastModified };
  }

  async get(userId: string, reportId: string): Promise<BackupRecord | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: env.backupTableName,
        Key: { userId, reportId },
      }),
    );
    if (!response.Item) {
      return null;
    }

    const item = response.Item as BackupRecord;
    return item;
  }
}
