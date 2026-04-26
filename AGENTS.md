# AGENTS.md - ProofPack

## Project mission
Build **ProofPack**, a local-first mobile app for service workers, cleaners, contractors, landlords, property managers, and tenants who need to create professional timestamped photo reports and export/share them as PDFs.

The MVP promise is: **create a report, add photos with notes/timestamps, export a clean PDF, and share it in one tap.**

## Assumed stack
Use this stack unless the repository already uses something else:

- React Native + Expo
- TypeScript
- Expo Router for navigation in a new project
- Local-first storage
- SQLite for structured report/photo/settings data
- FileSystem for local photo/PDF files
- Expo ImagePicker for camera and gallery import in the MVP
- Expo Location for optional GPS stamping
- Expo Print for generating PDFs from HTML
- Expo Sharing / native share sheet for exporting PDFs

Avoid adding a backend for the MVP.

## Product constraints
- No account system in the MVP.
- No server-side storage in the MVP.
- No social/community features.
- No AI features in the MVP.
- No subscriptions implementation until the core report flow works.
- Do not upload photos, location, reports, or client data anywhere.
- Location must be opt-in and easy to disable.
- Keep the app useful offline.
- Prioritize reliability over cleverness.

## Monetization model to preserve in the codebase
Build the product so it can support this later:

- Free tier: 3 reports per month, PDF watermark, basic templates.
- Pro tier: unlimited reports, remove watermark, add logo/company info, reusable client/property info, higher-quality PDF export.
- Preferred first paid options: annual unlock and lifetime unlock.

For the MVP, create an entitlement/paywall abstraction, but use a local dev entitlement flag until real App Store / Google Play purchases are added.

## Core MVP user flow
1. User opens the app and sees a list of reports.
2. User taps **New Report**.
3. User chooses a template or starts with a blank report.
4. User enters title, job/client/property name, optional address, and optional notes.
5. User adds photos from camera or gallery.
6. Each photo stores local URI, timestamp, optional location, optional caption/note, and section label.
7. User previews or exports a PDF.
8. User shares the PDF using the native share sheet.

## MVP templates
Include these built-in templates as data/config, not hardcoded throughout UI:

- Job Completion Report
- Before / After Report
- Property Condition Report
- Cleaning Proof Report

Each template may define default sections, but the report editor should still work if a template has no sections.

## Screens
Create a clean, boring, production-ready app structure with these screens:

- Reports List
- New Report / Template Picker
- Report Editor
- Add/Edit Photo Note
- PDF Preview / Export
- Settings / Branding
- Paywall Placeholder / Upgrade Explanation

## Data model
Use IDs as strings. Prefer UUIDs if available.

### Report
- id
- title
- templateId
- clientName
- propertyName
- address
- generalNotes
- createdAt
- updatedAt
- completedAt
- status: draft | completed | archived

### ReportPhoto
- id
- reportId
- localUri
- fileName
- caption
- sectionLabel
- takenAt
- latitude
- longitude
- locationAccuracy
- createdAt
- sortOrder

### BrandingSettings
- companyName
- contactName
- email
- phone
- website
- logoUri
- footerText

### EntitlementState
- isPro
- reportsCreatedThisMonth
- monthlyReportLimit
- watermarkEnabled

## PDF requirements
Generate PDFs locally from HTML.

PDF content must include:
- Report title
- Template name
- Client/property/job fields when present
- Address when present
- Creation/completion date
- Optional company branding for Pro users
- General notes when present
- Photo sections
- Each photo with timestamp, optional caption, optional location line
- Footer with app name and optional watermark for free users

PDF layout:
- Use a simple, printable style.
- Avoid tiny text.
- Do not crop photos aggressively.
- Use page-break rules so photo cards do not split badly.
- Keep the HTML generator in a pure function that can be unit tested.

## Code organization
Use a structure similar to this unless the project already has conventions:

```text
src/
  app/
  components/
  features/
    reports/
    photos/
    pdf/
    settings/
    entitlement/
  data/
    db/
    repositories/
  lib/
    dates.ts
    ids.ts
    permissions.ts
  types/
```

Keep platform and library calls out of UI components when practical. Use feature-level services/repositories.

## Coding standards
- TypeScript everywhere.
- Prefer small typed functions over large components.
- Avoid `any` unless there is a clear reason.
- Keep UI state simple.
- Use explicit loading/error/empty states.
- Validate user input before saving.
- Handle permission denial gracefully.
- Show friendly error messages for PDF generation and sharing failures.
- Do not leave dead code or unused dependencies.
- Keep comments rare and useful.

## Testing expectations
Add tests where they give high value without slowing the project down:

- PDF HTML generation tests.
- Date formatting tests.
- Repository/data mapping tests if practical.
- Entitlement limit logic tests.

Also include a manual QA checklist in the repo.

## Privacy and permissions
Make permission prompts specific and honest:

- Camera: needed to take report photos.
- Photos: needed to import existing job/property photos.
- Location: optional, used only to stamp photos with job location.

Do not request location automatically on app launch. Request it only when the user enables location stamping or takes/imports a photo with location stamping turned on.

## Out of scope until MVP is complete
Do not implement these until the core flow is stable:

- Cloud sync
- Login/accounts
- Teams
- Real-time collaboration
- OCR
- AI summaries
- Maps
- Complex invoicing
- E-signatures
- Client portals
- Chat/messaging
- Web dashboard
- Marketplace features

## Definition of done for the MVP
The MVP is done when a user can:

- Create a report.
- Add at least five photos.
- Add captions/notes.
- Export a readable PDF.
- Share that PDF to another app.
- Restart the app and still see the report and photos.
- Use the app without an internet connection.

