export type EntitlementPlan = 'free' | 'pro' | 'pro_annual' | 'lifetime';

export interface EntitlementState {
  plan: EntitlementPlan;
  tier?: EntitlementPlan;
  isPro: boolean;
  reportsCreatedThisMonth: number;
  monthlyReportLimit: number | null;
  watermarkEnabled: boolean;
  brandingEnabled: boolean;
  backupEnabled: boolean;
  currentMonthKey?: string;
}

export interface EntitlementDecision {
  allowed: boolean;
  remainingReports: number | null;
  reason?: string;
}

