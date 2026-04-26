import { getAppSetting, setAppSetting } from '@/repositories/appSettingsRepository';
import type { EntitlementPlan, EntitlementState } from '@/types/entitlement';

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

export const localEntitlementProvider = {
  load: loadLocalEntitlement,
  setOverridePlan: saveLocalEntitlementPlan,
  restorePurchases: async () => undefined,
};
