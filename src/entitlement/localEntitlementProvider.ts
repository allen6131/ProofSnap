import { getAppSetting, setAppSetting } from '@/repositories/appSettingsRepository';
import type { EntitlementPlan, EntitlementState } from '@/types/entitlement';

import { buildEntitlementState } from './entitlementRules';

const PLAN_SETTING_KEY = 'devEntitlementPlan';

export async function loadLocalEntitlement(
  reportsCreatedThisMonth: number,
): Promise<EntitlementState> {
  const plan = ((await getAppSetting(PLAN_SETTING_KEY)) as EntitlementPlan | null) ?? 'free';
  return buildEntitlementState({ plan, reportsCreatedThisMonth });
}

export async function saveLocalEntitlementPlan(plan: EntitlementPlan): Promise<void> {
  await setAppSetting(PLAN_SETTING_KEY, plan);
}

export const localEntitlementProvider = {
  load: loadLocalEntitlement,
  setOverridePlan: saveLocalEntitlementPlan,
  restorePurchases: async () => undefined,
};
