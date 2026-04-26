# Codex Task Prompts for ProofPack

Use these prompts one at a time. Let Codex finish, run tests/typecheck, and review the diff before moving to the next task.

## Task 0 - Inspect or initialize the repo
```text
We are building ProofPack, a local-first React Native + Expo + TypeScript app. Read AGENTS.md and docs/*.md first. Inspect the repository. If it is empty, initialize a new Expo app with TypeScript and Expo Router. If it already exists, adapt to its conventions. Do not implement product features yet. Set up formatting, basic folder structure, and a clean README. Then run the default typecheck/lint/test commands that exist, or add minimal scripts if missing. Summarize the resulting structure and any assumptions.
```

Acceptance criteria:
- Project runs locally.
- TypeScript is enabled.
- Basic folder structure exists.
- README describes the app and dev commands.

## Task 1 - Add core domain types and templates
```text
Implement the core ProofPack domain types and built-in report templates. Add TypeScript types for Report, ReportPhoto, BrandingSettings, EntitlementState, and ReportTemplate. Add four built-in templates: Job Completion Report, Before / After Report, Property Condition Report, and Cleaning Proof Report. Keep templates as data/config. Add simple tests for template IDs and default sections. Do not build UI yet beyond what is necessary to compile.
```

Acceptance criteria:
- Types compile.
- Templates are importable.
- Tests pass.

## Task 2 - Add local database and repositories
```text
Add local SQLite persistence for reports, report photos, branding settings, and app settings. Create idempotent migrations matching docs/DATA_MODEL.md. Implement repository functions for CRUD operations. Keep DB access out of UI components. Add tests for repository mapping if the test environment supports it; otherwise add a small dev-only smoke test utility and document manual validation.
```

Acceptance criteria:
- App initializes the DB on startup.
- Reports can be created, listed, updated, and deleted.
- Photo metadata can be added/listed/deleted.
- Branding settings can be saved and loaded.

## Task 3 - Build report list and create flow
```text
Build the Reports List screen and New Report / Template Picker flow. The report list should show title, template name, client/property field when available, photo count, and updated date. Add an empty state. The New Report flow should let the user choose a template or blank report and create a draft. Keep the UI clean and simple.
```

Acceptance criteria:
- User can create a report.
- New report appears in the list.
- Empty state is visible when no reports exist.
- Navigation works on iOS and Android simulators if available.

## Task 4 - Build report editor
```text
Build the Report Editor screen. Allow editing title, client/job/property name, address, general notes, and status. Show the report's photos below the fields. Include buttons to add from camera, add from library, preview/export PDF, and delete/archive report. Implement basic validation: title cannot be empty. Save changes reliably.
```

Acceptance criteria:
- User can edit and save report details.
- App persists changes after restart.
- Validation prevents empty titles.

## Task 5 - Add photo capture/import and metadata
```text
Implement adding photos to a report from the camera and photo library. Copy images into app-controlled local storage. Store photo metadata in SQLite, including local URI, timestamp, caption, section label, sort order, and optional location if enabled. Add a photo edit screen or modal to edit caption and section label. Handle camera, photo, and location permission denial gracefully.
```

Acceptance criteria:
- User can add at least five photos to a report.
- User can edit a photo caption and section label.
- Photos persist after app restart.
- Permission denial does not crash the app.

## Task 6 - Add PDF generation
```text
Implement local PDF export. Create a pure HTML generator function that takes report, photos, branding settings, template, and entitlement state. Use it to generate a PDF file locally. The PDF should include report metadata, notes, grouped photos, captions, timestamps, optional location, branding for Pro users, and a watermark/footer for free users. Add tests for the HTML generator.
```

Acceptance criteria:
- User can generate a PDF from a report.
- PDF opens and is readable.
- Watermark appears for free users.
- Branding appears for Pro users when configured.
- HTML generator tests pass.

## Task 7 - Add native sharing
```text
Add native sharing for generated PDFs. From the PDF Preview / Export screen, let the user generate and share the report. Show loading state while generating. Show friendly errors if PDF generation or sharing fails. Avoid generating duplicate files unnecessarily unless the report changed.
```

Acceptance criteria:
- User can share PDF to another app.
- Loading and error states work.
- Sharing cancellation does not corrupt state.

## Task 8 - Add settings, branding, and entitlement gates
```text
Build the Settings / Branding screen. Let the user save company name, contact info, website, footer text, and logo image. Implement the local entitlement module with free-tier limits: 3 reports/month and watermark enabled when not Pro. Add an Upgrade screen that explains Pro features, but keep purchase integration as a stub/provider interface for now.
```

Acceptance criteria:
- Branding settings persist.
- Free limit logic is implemented and tested.
- Upgrade screen explains Pro.
- The purchase provider is abstracted and easy to replace later.

## Task 9 - Polish and QA
```text
Perform a product polish pass. Improve empty states, error messages, spacing, keyboard behavior, and loading states. Add docs/QA_CHECKLIST.md if missing or update it. Run typecheck, lint, and tests. Fix any issues. Then summarize what is ready, what remains, and how to run the app.
```

Acceptance criteria:
- Typecheck passes.
- Tests pass where configured.
- Manual QA checklist is complete.
- README has setup and run instructions.

## Task 10 - Real purchases later
Do not start this until the MVP is working.

```text
Add real in-app purchase support using the chosen provider. Keep all purchase-specific code behind the existing entitlement provider interface. Support annual and lifetime unlock first. Add clear restore purchases behavior. Do not change the core report/PDF flow except where entitlement checks are needed. Document store setup steps separately.
```

Acceptance criteria:
- Entitlement interface remains clean.
- Restore purchases exists.
- Free tier still works.
- Pro unlock removes watermark and limits.

