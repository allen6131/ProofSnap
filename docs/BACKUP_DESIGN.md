# ProofSnap encrypted backup design

ProofSnap is offline-first. Reports, photos, PDFs, branding, and entitlement settings stay on the
device unless a user explicitly opts into backup later.

## MVP status

- No automatic upload is implemented.
- No account is required.
- Settings explain that encrypted cloud backup is a future opt-in Pro feature.
- Backup code is limited to provider interfaces so future cloud storage can be added without
  changing report repositories or PDF generation.

## Future backup requirements

1. Create a backup manifest that lists the SQLite database export plus report photo/PDF files.
2. Encrypt the archive on-device before it leaves local storage.
3. Store encryption material in platform secure storage or derive it from a user passphrase.
4. Upload only encrypted bytes to the selected provider.
5. Add explicit restore, conflict-resolution, and last-backup status UI.

Cloud-provider code must remain behind the `BackupProvider` interface.
