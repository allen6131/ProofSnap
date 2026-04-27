import { builtInReportTemplates, getReportTemplateById } from './reportTemplates';

describe('builtInReportTemplates', () => {
  it('contains stable unique template IDs', () => {
    const ids = builtInReportTemplates.map((template) => template.id);

    expect(ids).toEqual([
      'blank',
      'job-completion',
      'before-after',
      'property-condition',
      'cleaning-proof',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps starter templates configurable with default sections', () => {
    const beforeAfter = getReportTemplateById('before-after');
    const cleaning = getReportTemplateById('cleaning-proof');

    expect(beforeAfter?.defaultSections).toContain('Before');
    expect(beforeAfter?.defaultSections).toContain('After');
    expect(cleaning?.defaultSections).toContain('Kitchen');
    expect(cleaning?.isFree).toBe(true);
  });

  it('falls back to undefined for unknown template IDs', () => {
    expect(getReportTemplateById('missing-template')).toBeUndefined();
  });
});
