import type { EntitlementDecision, EntitlementPlan, EntitlementState } from '../types/entitlement';

export const FREE_MONTHLY_REPORT_LIMIT = 3;

export function getMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function buildEntitlementState(input: {
  plan?: EntitlementPlan;
  tier?: EntitlementPlan;
  reportsCreatedThisMonth?: number;
  currentMonthKey?: string;
}): EntitlementState {
  const plan = input.plan ?? input.tier ?? 'free';
  const isPro = plan !== 'free';

  return {
    plan,
    tier: plan,
    isPro,
    reportsCreatedThisMonth: input.reportsCreatedThisMonth ?? 0,
    monthlyReportLimit: isPro ? null : FREE_MONTHLY_REPORT_LIMIT,
    watermarkEnabled: !isPro,
    brandingEnabled: isPro,
    backupEnabled: false,
    currentMonthKey: input.currentMonthKey ?? getMonthKey(),
  };
}

export function createFreeEntitlement(reportsCreatedThisMonth = 0): EntitlementState {
  return buildEntitlementState({ plan: 'free', reportsCreatedThisMonth });
}

export function createPaidEntitlement(plan: Exclude<EntitlementPlan, 'free'>): EntitlementState {
  return buildEntitlementState({ plan });
}

export function canCreateReport(entitlement: EntitlementState): EntitlementDecision {
  if (entitlement.isPro || entitlement.monthlyReportLimit === null) {
    return { allowed: true, remainingReports: null };
  }

  const remainingReports = getRemainingFreeReports(entitlement) ?? 0;

  return remainingReports > 0
    ? { allowed: true, remainingReports }
    : { allowed: false, reason: 'monthly-limit', remainingReports: 0 };
}

export function getRemainingFreeReports(entitlement: EntitlementState): number | null {
  if (entitlement.isPro || entitlement.monthlyReportLimit === null) {
    return null;
  }

  return Math.max(entitlement.monthlyReportLimit - entitlement.reportsCreatedThisMonth, 0);
}

export function shouldShowWatermark(entitlement: EntitlementState): boolean {
  return entitlement.watermarkEnabled && !entitlement.isPro;
}

export function getReportLimitMessage(entitlement: EntitlementState): string {
  if (entitlement.isPro || entitlement.monthlyReportLimit === null) {
    return 'Your plan includes unlimited reports.';
  }

  return `Free users can create ${entitlement.monthlyReportLimit} free reports each month. Upgrade to ProofSnap Pro for unlimited reports and no watermark.`;
}
