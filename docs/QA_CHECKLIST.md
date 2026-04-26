# ProofSnap Manual QA Checklist

## App launch
- [ ] App launches without network connection.
- [ ] Empty report list explains the value of the app.
- [ ] Settings screen opens.

## Report creation
- [ ] Create blank report.
- [ ] Create report from each built-in template.
- [ ] Report title is required.
- [ ] Report appears in list after creation.
- [ ] Report persists after app restart.

## Report editing
- [ ] Edit title.
- [ ] Edit client/property/job field.
- [ ] Edit address.
- [ ] Edit general notes.
- [ ] Mark report completed.
- [ ] Changes persist after restart.

## Photos
- [ ] Add photo from camera.
- [ ] Add photo from library.
- [ ] Add at least five photos to one report.
- [ ] Edit photo caption.
- [ ] Edit section label.
- [ ] Delete photo.
- [ ] Denying camera permission shows friendly message.
- [ ] Denying photo permission shows friendly message.
- [ ] Location stamping is optional.
- [ ] Denying location permission does not block photo capture.

## PDF export
- [ ] Export report with no photos.
- [ ] Export report with several photos.
- [ ] PDF includes title and metadata.
- [ ] PDF includes captions.
- [ ] PDF includes timestamps.
- [ ] PDF includes optional location when enabled.
- [ ] Free PDF includes watermark/footer.
- [ ] Pro PDF removes watermark.
- [ ] Pro PDF includes branding when configured.
- [ ] PDF layout is readable on phone and desktop.

## Sharing
- [ ] Share sheet opens after PDF generation.
- [ ] PDF can be sent to email or saved to files.
- [ ] Canceling share does not crash app.
- [ ] Sharing unavailable/error path is handled.

## Settings and branding
- [ ] Save company name.
- [ ] Save contact info.
- [ ] Save logo image.
- [ ] Branding persists after restart.
- [ ] Branding appears in Pro PDF.

## Free/Pro gates
- [ ] Free user can create up to 3 reports/month.
- [ ] Free user sees upgrade prompt after limit.
- [ ] Pro flag allows unlimited reports.
- [ ] Free user PDFs show watermark.
- [ ] Pro user PDFs do not show watermark.

## Backup
- [ ] App clearly says backup is optional and not configured in the MVP.
- [ ] No report/photo data uploads during normal MVP flows.
- [ ] Backup provider boundary remains separate from report/photo repositories.

## Regression
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] No unused dependencies.
- [ ] App works on iOS simulator/device.
- [ ] App works on Android emulator/device.

