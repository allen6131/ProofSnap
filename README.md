# ProofSnap

ProofSnap is a local-first mobile app for contractors, cleaners, landlords, Airbnb hosts, property managers, and other mobile workers who need professional timestamped photo reports.

The MVP promise is simple: create a report, add timestamped photos with notes, export a readable PDF, and share it in one tap. The app stores report data and files on device by default. Optional encrypted cloud backup, real purchases, and AI assistance are designed behind interfaces for later phases, but the core app does not upload user photos or reports.

## Tech stack

- React Native + Expo
- TypeScript
- Expo Router
- SQLite and local file storage for offline-first data
- Expo ImagePicker, Location, Print, and Sharing for native workflows
- Jest for pure logic tests

## Development commands

```bash
npm install
npm start
npm run android
npm run ios
npm run web
npm run typecheck
npm run lint
npm test
```

## Current structure

- `app/` — Expo Router routes.
- `src/types/` — core domain types.
- `src/data/` — built-in report templates.
- `src/entitlement/` — free/Pro entitlement rules and purchase abstractions.
- `src/photos/` — camera/library import and app-controlled photo storage.
- `src/pdf/` — pure HTML report generation plus local PDF/share services.
- `src/repositories/` — SQLite repository layer.
- `src/backup/` — opt-in encrypted backup provider boundary for future cloud backup.
- `src/lib/` — shared utilities.
- `docs/` — product, data model, launch, and QA documentation.

## Freemium model

- Free: 3 reports/month, PDF watermark, basic templates.
- Pro Annual: target US$29.99/year, unlimited reports, no watermark, branding/logo.
- Lifetime: one-time unlock target, unlimited reports, no watermark.

The MVP uses a local entitlement abstraction so real App Store / Google Play purchases can be added later without changing the report or PDF flow.

