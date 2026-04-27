import jwt from 'jsonwebtoken';
import request from 'supertest';

import { createApp } from '../app';
import { env } from '../config/env';
import { resetStoresForTests } from '../stores/factory';

const makeToken = (
  userId: string,
  options?: {
    plan?: 'free' | 'pro';
    aiAssistQuota?: number;
    cloudBackupEnabled?: boolean;
  },
): string =>
  jwt.sign(
    {
      sub: userId,
      plan: options?.plan ?? 'pro',
      aiAssistQuota: options?.aiAssistQuota,
      cloudBackupEnabled: options?.cloudBackupEnabled,
    },
    env.jwtSecret,
  );

const analysisPayload = {
  reportId: 'report-123',
  templateName: 'Before / After Report',
  photos: [
    {
      photoId: 'photo-1',
      timestamp: '2026-04-20T12:00:00.000Z',
      section: 'before',
      thumbnailBase64: 'abc123',
    },
    {
      photoId: 'photo-2',
      timestamp: '2026-04-20T12:10:00.000Z',
      section: 'after',
      thumbnailBase64: 'abc123',
    },
  ],
};

describe('report routes', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    resetStoresForTests();
    app = createApp();
  });

  it('returns auth error when authorization header is missing', async () => {
    const response = await request(app).post('/api/report/analysis').send(analysisPayload);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Missing or invalid Authorization header' });
  });

  it('returns analysis suggestions for valid payload', async () => {
    const token = makeToken('user-a', { plan: 'pro', aiAssistQuota: 100 });

    const response = await request(app)
      .post('/api/report/analysis')
      .set('Authorization', `Bearer ${token}`)
      .send(analysisPayload);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      reportId: 'report-123',
      status: 'completed',
      aiSuggestedCaptions: [
        { photoId: 'photo-1', caption: expect.any(String) },
        { photoId: 'photo-2', caption: expect.any(String) },
      ],
      aiMissingShots: [],
      aiSections: [
        { photoId: 'photo-1', section: expect.any(String) },
        { photoId: 'photo-2', section: expect.any(String) },
      ],
      aiQualityWarnings: [{ photoId: 'photo-2', warnings: expect.any(Array) }],
      usage: {
        count: 1,
        limit: 100,
        month: expect.any(String),
      },
    });
  });

  it('enforces ai quota per user', async () => {
    const token = makeToken('quota-user', { plan: 'pro', aiAssistQuota: 1 });

    const first = await request(app)
      .post('/api/report/analysis')
      .set('Authorization', `Bearer ${token}`)
      .send(analysisPayload);
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/report/analysis')
      .set('Authorization', `Bearer ${token}`)
      .send(analysisPayload);

    expect(second.status).toBe(429);
    expect(second.body).toMatchObject({
      error: 'QuotaExceeded',
      usage: {
        count: 1,
        limit: 1,
        month: expect.any(String),
      },
    });
  });

  it('supports async analysis and callback retrieval', async () => {
    const token = makeToken('async-user', { plan: 'pro', aiAssistQuota: 5 });

    const queued = await request(app)
      .post('/api/report/analysis')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...analysisPayload,
        asyncProcessing: true,
      });

    expect(queued.status).toBe(202);
    expect(queued.body).toMatchObject({
      reportId: 'report-123',
      status: 'processing',
      callbackToken: expect.any(String),
      usage: {
        count: 1,
        limit: 5,
        month: expect.any(String),
      },
    });

    const callback = await request(app)
      .post('/api/report/analysis/callback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        analysisJobId: queued.body.callbackToken,
        reportId: 'report-123',
      });

    expect(callback.status).toBe(200);
    expect(callback.body).toMatchObject({
      reportId: 'report-123',
      status: 'completed',
      aiSuggestedCaptions: expect.any(Array),
      aiMissingShots: expect.any(Array),
      aiSections: expect.any(Array),
      aiQualityWarnings: expect.any(Array),
      processedAt: expect.any(String),
    });
  });

  it('rejects callback request for other users', async () => {
    const ownerToken = makeToken('owner-user', { plan: 'pro', aiAssistQuota: 5 });
    const otherToken = makeToken('other-user', { plan: 'pro', aiAssistQuota: 5 });

    const queued = await request(app)
      .post('/api/report/analysis')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        ...analysisPayload,
        asyncProcessing: true,
      });

    const callback = await request(app)
      .post('/api/report/analysis/callback')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        analysisJobId: queued.body.callbackToken,
        reportId: 'report-123',
      });

    expect(callback.status).toBe(404);
    expect(callback.body).toEqual({ error: 'AnalysisResultNotFound' });
  });

  it('allows backup for users with cloud backup enabled', async () => {
    const token = makeToken('backup-user', {
      plan: 'pro',
      cloudBackupEnabled: true,
    });

    const backupPayload = {
      reportId: 'backup-report',
      encryptedBlob: 'ENCRYPTED_PAYLOAD',
      timestamp: '2026-04-21T09:00:00.000Z',
      photoReferences: ['file://a.jpg', 'file://b.jpg'],
    };

    const save = await request(app)
      .post('/api/report/backup')
      .set('Authorization', `Bearer ${token}`)
      .send(backupPayload);

    expect(save.status).toBe(200);
    expect(save.headers.etag).toBeDefined();
    expect(save.body).toMatchObject({
      reportId: 'backup-report',
      etag: expect.any(String),
      lastModified: expect.any(String),
    });

    const get = await request(app)
      .get('/api/report/backup/backup-report')
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    expect(get.headers.etag).toBeDefined();
    expect(get.body).toMatchObject({
      userId: 'backup-user',
      reportId: 'backup-report',
      encryptedBlob: 'ENCRYPTED_PAYLOAD',
      photoReferences: ['file://a.jpg', 'file://b.jpg'],
      timestamp: '2026-04-21T09:00:00.000Z',
      lastModified: expect.any(String),
      etag: expect.any(String),
    });
  });

  it('rejects backup for users without cloud backup access', async () => {
    const token = makeToken('free-user', {
      plan: 'free',
      cloudBackupEnabled: false,
    });

    const response = await request(app)
      .post('/api/report/backup')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reportId: 'backup-report',
        encryptedBlob: 'ENCRYPTED_PAYLOAD',
        timestamp: '2026-04-21T09:00:00.000Z',
        photoReferences: [],
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'BackupNotAvailableForPlan' });
  });

  it('returns validation error for malformed payload', async () => {
    const token = makeToken('valid-user', { plan: 'pro', aiAssistQuota: 2 });

    const response = await request(app)
      .post('/api/report/analysis')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reportId: '',
        templateName: 'Before / After Report',
        photos: [],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ValidationError');
    expect(response.body.details).toEqual(expect.any(Array));
  });
});
