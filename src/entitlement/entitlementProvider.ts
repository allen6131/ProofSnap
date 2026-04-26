import type { EntitlementPlan, EntitlementState } from '@/types/entitlement';

export interface EntitlementProvider {
  load(reportsCreatedThisMonth?: number): Promise<EntitlementState>;
  setOverridePlan(plan: EntitlementPlan): Promise<void>;
  refreshPurchases(): Promise<EntitlementState>;
  restorePurchases(): Promise<EntitlementState>;
}
