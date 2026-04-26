import {
  buildEntitlementState,
  canCreateReport,
  getMonthKey,
  getReportLimitMessage,
  shouldShowWatermark,
} from './entitlementRules';

describe('entitlement rules', () => {
  it('allows free users to create up to three reports per month', () => {
    const state = buildEntitlementState({
      tier: 'free',
      reportsCreatedThisMonth: 2,
      currentMonthKey: '2026-04',
    });

    expect(canCreateReport(state)).toEqual({
      allowed: true,
      remainingReports: 1,
    });
  });

  it('blocks free users after three reports in a month', () => {
    const state = buildEntitlementState({
      tier: 'free',
      reportsCreatedThisMonth: 3,
      currentMonthKey: '2026-04',
    });

    expect(canCreateReport(state)).toEqual({
      allowed: false,
      reason: 'monthly-limit',
      remainingReports: 0,
    });
    expect(getReportLimitMessage(state)).toContain('3 free reports');
  });

  it('allows pro and lifetime users unlimited reports without watermark', () => {
    const pro = buildEntitlementState({
      tier: 'pro',
      reportsCreatedThisMonth: 99,
    });
    const lifetime = buildEntitlementState({
      tier: 'lifetime',
      reportsCreatedThisMonth: 99,
    });

    expect(canCreateReport(pro)).toEqual({ allowed: true, remainingReports: null });
    expect(canCreateReport(lifetime)).toEqual({ allowed: true, remainingReports: null });
    expect(shouldShowWatermark(pro)).toBe(false);
    expect(shouldShowWatermark(lifetime)).toBe(false);
  });

  it('formats stable UTC month keys', () => {
    expect(getMonthKey(new Date('2026-04-26T23:30:00.000Z'))).toBe('2026-04');
  });
});
