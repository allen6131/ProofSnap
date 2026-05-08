# Codex Task Prompts for rampready

Use these prompts one at a time. Let Codex finish, run tests/typecheck, and review the diff before moving to the next task.

## Task 0 - Verify local setup
```text
We are building rampready, a beginner-friendly ramp and launch-window planning app for people new to boating. Read AGENTS.md and docs/*.md first. Inspect the repository, install dependencies, and run the default typecheck/test commands. Summarize the working local setup and any blockers.
```

Acceptance criteria:
- Project installs locally.
- README setup commands are accurate.
- Backend tests pass where configured.
- Admin and mobile typechecks pass.

## Task 1 - Polish beginner onboarding
```text
Improve mobile onboarding copy for new boaters. Explain what rampready does, what it does not do, and why users should save ramps and tune comfort limits. Keep copy concise and planning-only.
```

Acceptance criteria:
- Login/register screens describe beginner-friendly planning.
- Disclaimers remain clear.
- Typecheck passes.

## Task 2 - Improve ramp search UX
```text
Improve the Ramps screen with loading, empty, and error states. Keep the UI simple. Search should feel useful for ramp names, city, or area terms.
```

Acceptance criteria:
- Loading state is visible.
- Empty state helps users recover.
- API errors show a friendly message.
- Typecheck passes.

## Task 3 - Strengthen ramp detail guidance
```text
Improve Ramp Detail so beginners can understand launch windows quickly. Preserve green/yellow/red/gray scoring, reasons, confidence, source names, and planning-only disclaimer.
```

Acceptance criteria:
- Top reasons are easy to scan.
- Low confidence and missing data are clear.
- Save and issue-report actions still work.

## Task 4 - Admin curation polish
```text
Improve admin workflows for ramp review, verification, source refresh, and report triage. Keep backend authorization intact.
```

Acceptance criteria:
- Admin pages load cleanly.
- Ramp edit/verify flow works.
- Jobs and source health are understandable.

## Task 5 - Production readiness pass
```text
Run backend tests, backend lint, admin typecheck/build, and mobile typecheck. Fix issues without broad unrelated refactors. Update docs/QA_CHECKLIST.md for any changed behavior.
```

Acceptance criteria:
- Tests pass where configured.
- Typechecks pass.
- README and QA checklist match the app.
