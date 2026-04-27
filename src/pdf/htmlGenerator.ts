import { getTemplateById } from '@/data/reportTemplates';
import { formatDate, formatPhotoTimestamp } from '@/lib/dates';
import { APP_NAME, formatLocationLine } from '@/lib/format';
import type { ReportPhoto } from '@/types/photo';

import type { GenerateReportHtmlInput } from './pdfTypes';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function optionalRow(label: string, value?: string | null): string {
  if (!value?.trim()) {
    return '';
  }

  return `<div class="meta-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value.trim())}</span></div>`;
}

function groupPhotosBySection(photos: ReportPhoto[]): Map<string, ReportPhoto[]> {
  const sections = new Map<string, ReportPhoto[]>();
  for (const photo of photos) {
    const section = photo.sectionLabel?.trim() || 'Photos';
    sections.set(section, [...(sections.get(section) ?? []), photo]);
  }
  return sections;
}

export function generateReportHtml({
  report,
  photos,
  branding,
  entitlement,
}: GenerateReportHtmlInput): string {
  const template = getTemplateById(report.templateId);
  const sections = groupPhotosBySection(photos);
  const showBranding = entitlement.brandingEnabled && Boolean(branding.companyName?.trim());
  const showWatermark = entitlement.watermarkEnabled && !entitlement.isPro;

  const brandingBlock = showBranding
    ? `<section class="branding">
        ${branding.logoUri ? `<img class="logo" src="${escapeHtml(branding.logoUri)}" />` : ''}
        <div>
          <h2>${escapeHtml(branding.companyName ?? '')}</h2>
          <p>${escapeHtml([branding.contactName, branding.email, branding.phone, branding.website].filter(Boolean).join(' • '))}</p>
        </div>
      </section>`
    : '';

  const photoSections =
    photos.length === 0
      ? '<p class="empty">No photos were added to this report.</p>'
      : [...sections.entries()]
          .map(
            ([section, sectionPhotos]) => `
            <section class="section">
              <h2>${escapeHtml(section)}</h2>
              <div class="photo-grid">
                ${sectionPhotos
                  .map((photo) => {
                    const location = formatLocationLine(photo.latitude, photo.longitude);
                    return `<article class="photo-card">
                      <img src="${escapeHtml(photo.localUri)}" />
                      <div class="photo-meta">
                        <strong>${escapeHtml(formatPhotoTimestamp(photo.takenAt))}</strong>
                        ${photo.caption ? `<p>${escapeHtml(photo.caption)}</p>` : ''}
                        ${location ? `<p class="location">Location: ${escapeHtml(location)}</p>` : ''}
                      </div>
                    </article>`;
                  })
                  .join('')}
              </div>
            </section>`,
          )
          .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 36px; }
      h1 { font-size: 32px; margin: 0 0 8px; }
      h2 { font-size: 20px; margin: 0 0 12px; }
      p { line-height: 1.45; }
      .subtitle { color: #475569; margin-bottom: 24px; }
      .branding { align-items: center; border: 1px solid #cbd5e1; border-radius: 14px; display: flex; gap: 16px; margin-bottom: 24px; padding: 16px; }
      .logo { height: 64px; object-fit: contain; width: 64px; }
      .meta { background: #f8fafc; border-radius: 14px; margin-bottom: 24px; padding: 16px; }
      .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
      .meta-row strong { color: #334155; margin-right: 20px; }
      .notes { border-left: 4px solid #2563eb; margin-bottom: 28px; padding-left: 14px; }
      .section { margin-top: 26px; }
      .photo-grid { display: grid; gap: 18px; grid-template-columns: 1fr 1fr; }
      .photo-card { border: 1px solid #e2e8f0; border-radius: 14px; break-inside: avoid; overflow: hidden; page-break-inside: avoid; }
      .photo-card img { display: block; max-height: 320px; object-fit: contain; width: 100%; }
      .photo-meta { padding: 12px; }
      .location, .empty { color: #64748b; }
      footer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 12px; margin-top: 36px; padding-top: 12px; text-align: center; }
      .watermark { color: #b91c1c; font-weight: 800; margin-top: 6px; text-transform: uppercase; }
    </style>
  </head>
  <body>
    ${brandingBlock}
    <h1>${escapeHtml(report.title)}</h1>
    <p class="subtitle">${escapeHtml(template.name)}</p>
    <section class="meta">
      ${optionalRow('Client / job / property', report.clientName ?? report.propertyName)}
      ${optionalRow('Address', report.address)}
      ${optionalRow('Created', formatDate(report.createdAt))}
      ${optionalRow('Completed', report.completedAt ? formatDate(report.completedAt) : null)}
      ${optionalRow('Status', report.status)}
    </section>
    ${report.generalNotes ? `<section class="notes"><h2>Notes</h2><p>${escapeHtml(report.generalNotes)}</p></section>` : ''}
    ${photoSections}
    <footer>
      Created with ${APP_NAME}${branding.footerText && entitlement.brandingEnabled ? ` • ${escapeHtml(branding.footerText)}` : ''}
      ${showWatermark ? '<div class="watermark">Free ProofSnap report watermark</div>' : ''}
    </footer>
  </body>
</html>`;
}
