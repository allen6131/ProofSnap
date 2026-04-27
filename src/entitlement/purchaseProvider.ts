import type { EntitlementPlan } from '@/types/entitlement';

export type PurchaseProductId = 'pro_annual' | 'lifetime';

export interface PurchaseResult {
  success: boolean;
  plan?: Exclude<EntitlementPlan, 'free'>;
  message?: string;
}

export interface PurchaseProvider {
  refreshPurchases(): Promise<PurchaseResult>;
  restorePurchases(): Promise<PurchaseResult>;
  startPurchase(productId: PurchaseProductId): Promise<PurchaseResult>;
}

export const stubPurchaseProvider: PurchaseProvider = {
  async refreshPurchases() {
    return {
      success: false,
      message: 'Real App Store and Google Play purchases are not enabled in the MVP.',
    };
  },
  async restorePurchases() {
    return {
      success: false,
      message: 'Restore purchases is a provider stub until store integration is added.',
    };
  },
  async startPurchase(productId) {
    return {
      success: false,
      plan: productId,
      message: 'Purchase flow is stubbed for the MVP. Use local Pro mode for QA.',
    };
  },
};
