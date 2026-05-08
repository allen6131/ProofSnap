# ProofSnap Backend (Serverless, Stateless, Privacy-First)

This backend adds two optional capabilities to ProofSnap while keeping the product local-first:

1. AI report analysis (metadata + thumbnails/URLs only, no original image storage)
2. Optional encrypted cloud backup (client-encrypted blobs only)

The service is intentionally lean so it can scale to zero and avoid the heavy cloud-first model seen in competitors.

## Stack

- Node.js + TypeScript
- Express
- Serverless Framework (AWS Lambda + API Gateway HTTP API)
- JWT authentication
- Zod request validation
- DynamoDB-ready stores with in-memory fallback for local development/tests

## Design principles

- **Offline-first compatible**: mobile app works without this backend.
- **Private by design**: no raw photo storage; only metadata and optional encrypted blobs.
- **Stateless API**: all request state comes from JWT + payload + storage.
- **Serverless scaling**: Lambda deployment target for scale-to-zero behavior.

## Endpoints

All endpoints require `Authorization: Bearer <JWT>`.

JWT claims used:

- `sub` (required): user ID
- `plan` (optional): `free` or `pro`
- `cloudBackupEnabled` (optional): explicit backup entitlement
- `aiAssistQuota` (optional): per-user monthly quota override

### POST `/api/report/analysis`

Runs AI analysis (mock implementation now) and tracks usage against monthly quota.

Request:

```json
{
  "reportId": "report-123",
  "templateName": "Before / After Report",
  "asyncProcessing": false,
  "photos": [
    {
      "photoId": "photo-1",
      "timestamp": "2026-04-20T12:00:00.000Z",
      "latitude": 37.77,
      "longitude": -122.42,
      "section": "before",
      "thumbnailBase64": "..."
    }
  ]
}
```

Rules:

- `photos[].timestamp` must be ISO datetime.
- Each photo must include either `thumbnailBase64` or `thumbnailUrl`.
- Quota is enforced per user per month.

Sync response (`200`):

```json
{
  "reportId": "report-123",
  "status": "completed",
  "aiSuggestedCaptions": [{ "photoId": "photo-1", "caption": "..." }],
  "aiMissingShots": ["after"],
  "aiSections": [{ "photoId": "photo-1", "section": "before" }],
  "aiQualityWarnings": [{ "photoId": "photo-1", "warnings": ["Potential duplicate image"] }],
  "usage": { "count": 1, "limit": 75, "month": "2026-04" }
}
```

Async response (`202` with `asyncProcessing: true`):

```json
{
  "reportId": "report-123",
  "status": "processing",
  "callbackToken": "analysis-job-id",
  "aiSuggestedCaptions": [],
  "aiMissingShots": [],
  "aiSections": [],
  "aiQualityWarnings": [],
  "usage": { "count": 1, "limit": 75, "month": "2026-04" }
}
```

Quota exceeded (`429`):

```json
{
  "error": "QuotaExceeded",
  "message": "Monthly AI assist quota exceeded.",
  "usage": { "count": 75, "limit": 75, "month": "2026-04" }
}
```

### POST `/api/report/analysis/callback`

Fetches an async analysis result.

Request:

```json
{
  "analysisJobId": "analysis-job-id",
  "reportId": "report-123"
}
```

Success (`200`):

```json
{
  "reportId": "report-123",
  "status": "completed",
  "aiSuggestedCaptions": [{ "photoId": "photo-1", "caption": "..." }],
  "aiMissingShots": [],
  "aiSections": [{ "photoId": "photo-1", "section": "before" }],
  "aiQualityWarnings": [],
  "processedAt": "2026-04-27T19:00:00.000Z"
}
```

Not found / wrong user (`404`):

```json
{ "error": "AnalysisResultNotFound" }
```

### POST `/api/report/backup`

Stores encrypted report backup data if entitlement allows cloud backup.

Request:

```json
{
  "reportId": "report-123",
  "encryptedBlob": "BASE64_OR_ENCRYPTED_PAYLOAD",
  "timestamp": "2026-04-21T09:00:00.000Z",
  "photoReferences": ["file://photo-1.jpg", "file://photo-2.jpg"]
}
```

Success (`200`, with `ETag` header):

```json
{
  "reportId": "report-123",
  "etag": "\"ZXRhZy1leGFtcGxl\"",
  "lastModified": "2026-04-27T19:00:00.000Z"
}
```

Entitlement failure (`403`):

```json
{ "error": "BackupNotAvailableForPlan" }
```

### GET `/api/report/backup/:reportId`

Returns encrypted backup data for the authenticated user.

Success (`200`, with `ETag` header):

```json
{
  "userId": "user-123",
  "reportId": "report-123",
  "encryptedBlob": "BASE64_OR_ENCRYPTED_PAYLOAD",
  "photoReferences": ["file://photo-1.jpg"],
  "timestamp": "2026-04-21T09:00:00.000Z",
  "lastModified": "2026-04-27T19:00:00.000Z",
  "etag": "\"ZXRhZy1leGFtcGxl\""
}
```

Not found (`404`):

```json
{ "error": "BackupNotFound" }
```

### Shared errors

- `401` `{ "error": "Missing or invalid Authorization header" }`
- `401` `{ "error": "Invalid token" }`
- `400` validation errors:

```json
{
  "error": "ValidationError",
  "details": [{ "path": "photos.0.thumbnailBase64", "message": "Provide either thumbnailBase64 or thumbnailUrl" }]
}
```

## Usage tracking and quota

- Usage key: `userId + YYYY-MM`.
- Increment occurs for every accepted `/analysis` request.
- Quota defaults:
  - Pro: `AI_MONTHLY_QUOTA_PRO` (default `75`)
  - Free: `AI_MONTHLY_QUOTA_FREE` (default `0`)
- JWT `aiAssistQuota` can override the effective limit per user.

## Local development

1. Install:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

3. Run dev server:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:4000/health
```

## Tests

Run endpoint tests:

```bash
npm test
```

The test suite validates:

- Auth enforcement
- Analysis JSON response contract
- Monthly quota enforcement
- Async callback flow and ownership checks
- Backup entitlement checks
- Backup read/write contract
- Validation error shape

## Deployment (AWS Lambda via Serverless Framework)

1. Build:

```bash
npm run build
```

2. Set deployment env vars (at minimum):

- `JWT_SECRET`
- `STORE_PROVIDER=dynamo`
- `BACKUP_TABLE_NAME`
- `USAGE_TABLE_NAME`
- `ANALYSIS_TABLE_NAME`
- `AWS_REGION`

3. Deploy:

```bash
npm run deploy
```

For local API emulation:

```bash
npm run offline
```

## DynamoDB table notes

Recommended keys:

- Backups table: partition key `userId`, sort key `reportId`
- Usage table: partition key `userId`, sort key `monthKey`
- Analysis table: partition key `callbackId`

This backend intentionally excludes payment processing and account management; app-store purchase state and user context remain client-driven.
