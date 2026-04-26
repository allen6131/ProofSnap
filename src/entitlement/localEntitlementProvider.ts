import { getAppSetting, setAppSetting } from '@/repositories/appSettingsRepository';
import type { EntitlementPlan, EntitlementState } from '@/types/entitlement';

import type { EntitlementProvider } from './entitlementProvider';
import { buildEntitlementState } from './entitlementRules';

export const ENTITLEMENT_PLAN_SETTING_KEY = 'dev.entitlement.plan';

export async function loadLocalEntitlement(
  reportsCreatedThisMonth = 0,
): Promise<EntitlementState> {
  const plan = ((await getAppSetting(ENTITLEMENT_PLAN_SETTING_KEY)) as EntitlementPlan | null) ?? 'free';
  return buildEntitlementState({ plan, reportsCreatedThisMonth });
}

export async function saveLocalEntitlementPlan(plan: EntitlementPlan): Promise<void> {
  await setAppSetting(ENTITLEMENT_PLAN_SETTING_KEY, plan);
}

export const localEntitlementProvider: EntitlementProvider & {
  setOverridePlan(plan: EntitlementPlan): Promise<void>;
} = {
  load: loadLocalEntitlement,
  refreshPurchases: loadLocalEntitlement,
  setOverridePlan: saveLocalEntitlementPlan,
  restorePurchases: async (reportsCreatedThisMonth = 0) => loadLocalEntitlement(reportsCreatedThisMonth),
};

export const localPurchaseProvider = {
  async startAnnualPurchase(): Promise<EntitlementState> {
    await saveLocalEntitlementPlan('pro_annual');
    return loadLocalEntitlement();
  },
  async startLifetimePurchase(): Promise<EntitlementState> {
    await saveLocalEntitlementPlan('lifetime');
    return loadLocalEntitlement();
  },
  async restorePurchases(): Promise<EntitlementState> {
    return localEntitlementProvider.restorePurchases();
  },
};
