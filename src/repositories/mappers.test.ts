import { mapBrandingSettingsRow, mapReportListRow, mapReportPhotoRow, mapReportRow } from './mappers';

describe('repository mappers', () => {
  it('maps report rows to domain shape', () => {
    expect(
      mapReportRow({
        id: 'r1',
        title: 'Move-out',
        template_id: 'property-condition',
        client_name: 'Client',
        property_name: 'Unit 2',
        address: '12 Main',
        general_notes: 'Notes',
        status: 'completed',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-02T00:00:00.000Z',
        completed_at: '2026-04-03T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: 'r1',
      templateId: 'property-condition',
      propertyName: 'Unit 2',
      status: 'completed',
    });
  });

  it('normalizes unknown report statuses and includes photo count', () => {
    expect(
      mapReportListRow({
        id: 'r1',
        title: 'Report',
        template_id: null,
        client_name: null,
        property_name: null,
        address: null,
        general_notes: null,
        status: 'weird',
        created_at: '2026-04-01T00:00:00.000Z',
        updated_at: '2026-04-02T00:00:00.000Z',
        completed_at: null,
        photo_count: 4,
      }),
    ).toMatchObject({ status: 'draft', photoCount: 4 });
  });

  it('maps photo and branding rows', () => {
    expect(
      mapReportPhotoRow({
        id: 'p1',
        report_id: 'r1',
        local_uri: 'file:///photo.jpg',
        file_name: 'photo.jpg',
        caption: 'After',
        section_label: 'After',
        taken_at: '2026-04-02T00:00:00.000Z',
        latitude: 1,
        longitude: 2,
        location_accuracy: 3,
        created_at: '2026-04-02T00:00:00.000Z',
        sort_order: 1,
      }),
    ).toMatchObject({ reportId: 'r1', localUri: 'file:///photo.jpg', sectionLabel: 'After' });

    expect(mapBrandingSettingsRow(null)).toMatchObject({ id: 'default' });
  });
});
