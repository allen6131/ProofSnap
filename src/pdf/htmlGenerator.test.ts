import { buildEntitlementState } from '@/entitlement/entitlementRules';
import type { ReportPhoto } from '@/types/photo';
import type { Report } from '@/types/report';

import { generateReportHtml } from './htmlGenerator';

const report: Report = {
  id: 'report-1',
  title: 'Cleaning Proof Report',
  templateId: 'cleaning-proof',
  clientName: 'Harbor Airbnb',
  propertyName: null,
  address: '123 Ocean Ave',
  generalNotes: 'Guest-ready turnover completed.',
  status: 'completed',
  createdAt: '2026-04-26T10:00:00.000Z',
  updatedAt: '2026-04-26T11:00:00.000Z',
  completedAt: '2026-04-26T11:00:00.000Z',
};

const photos: ReportPhoto[] = [
  {
    id: 'photo-1',
    reportId: 'report-1',
    localUri: 'file:///kitchen.jpg',
    fileName: 'kitchen.jpg',
    caption: 'Kitchen cleaned',
    sectionLabel: 'Kitchen',
    takenAt: '2026-04-26T10:30:00.000Z',
    latitude: 40.123456,
    longitude: -73.123456,
    locationAccuracy: 8,
    createdAt: '2026-04-26T10:30:00.000Z',
    sortOrder: 0,
  },
];

describe('generateReportHtml', () => {
  it('includes free watermark and report photo metadata', () => {
    const html = generateReportHtml({
      report,
      photos,
      branding: { id: 'default' },
      entitlement: buildEntitlementState({ plan: 'free' }),
    });

    expect(html).toContain('Cleaning Proof Report');
    expect(html).toContain('Harbor Airbnb');
    expect(html).toContain('Kitchen cleaned');
    expect(html).toContain('40.12346, -73.12346');
    expect(html).toContain('Free ProofSnap report watermark');
  });

  it('includes branding for paid users and removes watermark', () => {
    const html = generateReportHtml({
      report,
      photos,
      entitlement: buildEntitlementState({ plan: 'lifetime' }),
      branding: {
        id: 'default',
        companyName: 'Shine Co',
        email: 'ops@example.com',
        footerText: 'Thank you',
      },
    });

    expect(html).toContain('Shine Co');
    expect(html).toContain('ops@example.com');
    expect(html).toContain('Thank you');
    expect(html).not.toContain('Created with ProofSnap Free');
  });
});
