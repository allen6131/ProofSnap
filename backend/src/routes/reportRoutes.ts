import type { Request, Response } from 'express';
import { Router } from 'express';

import type { AuthenticatedRequest } from '../types/express';
import { analyzeReport, analyzeReportAsync } from '../services/aiAnalysisService';
import {
  analysisCallbackRequestSchema,
  analysisRequestSchema,
  backupRequestSchema,
} from '../services/validation';
import { requireAuth } from '../middleware/auth';
import type { StoreBundle } from '../stores/interfaces';

const monthKeyFromIso = (isoTimestamp: string): string => isoTimestamp.slice(0, 7);
const currentMonthKey = (): string => monthKeyFromIso(new Date().toISOString());

const makeEtag = (value: string): string => `"${Buffer.from(value).toString('base64url').slice(0, 32)}"`;

export const createReportRouter = (stores: StoreBundle): Router => {
  const router = Router();
  router.use(requireAuth);

  router.post('/analysis', async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const payload = analysisRequestSchema.parse(req.body);

    const monthKey = currentMonthKey();
    const currentUsage = await stores.quotaUsageStore.getUsageForMonth(
      request.auth.userId,
      monthKey,
    );
    const limit = request.auth.aiAssistQuota;

    if (currentUsage.count >= limit) {
      res.status(429).json({
        error: 'QuotaExceeded',
        message: 'Monthly AI assist quota exceeded.',
        usage: {
          count: currentUsage.count,
          limit,
          month: monthKey,
        },
      });
      return;
    }

    const updatedUsage = await stores.quotaUsageStore.incrementUsageForMonth(
      request.auth.userId,
      monthKey,
      limit,
    );

    if (payload.asyncProcessing) {
      const asyncResult = await analyzeReportAsync(
        payload,
        request.auth.userId,
        stores.analysisResultsStore,
      );
      res.status(202).json({
        ...asyncResult.response,
        usage: {
          count: updatedUsage.count,
          limit: updatedUsage.limit,
          month: monthKey,
        },
      });
      return;
    }

    const result = analyzeReport(payload);
    res.status(200).json({
      ...result,
      usage: {
        count: updatedUsage.count,
        limit: updatedUsage.limit,
        month: monthKey,
      },
    });
  });

  router.post('/analysis/callback', async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const payload = analysisCallbackRequestSchema.parse(req.body);
    const stored = await stores.analysisResultsStore.get(payload.analysisJobId);

    if (!stored || stored.reportId !== payload.reportId || stored.userId !== request.auth.userId) {
      res.status(404).json({ error: 'AnalysisResultNotFound' });
      return;
    }

    res.status(200).json({
      reportId: stored.reportId,
      aiSuggestedCaptions: stored.aiSuggestedCaptions,
      aiMissingShots: stored.aiMissingShots,
      aiSections: stored.aiSections,
      aiQualityWarnings: stored.aiQualityWarnings,
      status: 'completed',
      processedAt: stored.createdAt,
    });
  });

  router.post('/backup', async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    if (!request.auth.cloudBackupEnabled) {
      res.status(403).json({ error: 'BackupNotAvailableForPlan' });
      return;
    }

    const payload = backupRequestSchema.parse(req.body);
    const now = new Date().toISOString();
    const putResult = await stores.backupStore.put({
      userId: request.auth.userId,
      reportId: payload.reportId,
      encryptedBlob: payload.encryptedBlob,
      photoReferences: payload.photoReferences,
      timestamp: payload.timestamp,
      updatedAt: now,
    });

    const etag = makeEtag(`${request.auth.userId}:${payload.reportId}:${putResult.lastModified}`);
    res
      .status(200)
      .setHeader('ETag', etag)
      .json({
        reportId: payload.reportId,
        etag,
        lastModified: putResult.lastModified,
      });
  });

  router.get('/backup/:reportId', async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const reportId = String(req.params.reportId);
    const record = await stores.backupStore.get(request.auth.userId, reportId);

    if (!record) {
      res.status(404).json({ error: 'BackupNotFound' });
      return;
    }

    const etag = makeEtag(`${record.userId}:${record.reportId}:${record.updatedAt}`);
    res
      .status(200)
      .setHeader('ETag', etag)
      .json({
        userId: record.userId,
        reportId: record.reportId,
        encryptedBlob: record.encryptedBlob,
        photoReferences: record.photoReferences,
        timestamp: record.timestamp,
        lastModified: record.updatedAt,
        etag,
      });
  });

  return router;
};
