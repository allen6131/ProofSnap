# ProofPack MVP Specification

## Non-negotiable MVP scope
The first version should be intentionally small:

1. Local reports
2. Photo capture/import
3. Photo notes and timestamps
4. Optional location stamps
5. PDF generation
6. Native sharing
7. Branding settings
8. Free/Pro gate placeholder

## Report list
### Requirements
- Show all reports sorted by updated date descending.
- Show title, template, client/property name, photo count, and updated date.
- Empty state: explain what the app does and show **Create your first report**.

### Actions
- Create new report
- Open report
- Archive/delete report with confirmation

## Template picker
### Requirements
- Show four starter templates.
- Allow blank report.
- Template selection should prefill useful section labels, not lock the user into a rigid form.

## Report editor
### Fields
- Title
- Client/job/property name
- Address
- General notes
- Status: draft/completed

### Photo list
- Show thumbnail, caption, timestamp, section label.
- Allow reordering by simple move up/down if drag-and-drop is too much.
- Allow edit caption/section.
- Allow delete with confirmation.

## Photo capture/import
### Requirements
- Add from camera.
- Add from photo library.
- Copy selected/captured images into app-controlled local storage.
- Store metadata in SQLite.
- Do not rely on the original external asset remaining available.
- Optional location stamping only after permission is granted.

## PDF export
### Requirements
- Generate locally.
- Include all report metadata and photos.
- Use readable layout.
- Free users get a watermark/footer.
- Pro users can include branding and remove watermark.

## Sharing
### Requirements
- Share the generated PDF through the platform share sheet.
- Show user-friendly errors if sharing is unavailable or canceled.

## Settings/Branding
### Requirements
- Company name
- Contact name
- Email
- Phone
- Website
- Logo image
- Footer text
- Pro badge if enabled

## Entitlement placeholder
Build the app so real purchases can be added later.

For MVP development:
- Use a local setting or constant for `isPro`.
- Implement the free monthly report limit in a small, tested entitlement module.
- Keep purchase-provider-specific code behind an interface.

