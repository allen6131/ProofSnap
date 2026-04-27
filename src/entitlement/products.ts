export const PRO_ANNUAL_PRICE = 'US$29.99/year';
export const LIFETIME_PRICE = 'US$39.99 one-time';

export const FREE_FEATURES = ['3 reports per month', 'ProofSnap watermark', 'Basic templates'];

export const PRO_FEATURES = [
  'Unlimited reports',
  'Remove PDF watermark',
  'Company logo and contact branding',
  'Optional encrypted backup foundation',
  'Future AI assist quotas when enabled',
];

export interface EntitlementProduct {
  id: 'free' | 'pro_annual' | 'lifetime';
  name: string;
  priceLabel: string;
  features: string[];
}

export const ENTITLEMENT_PRODUCTS: EntitlementProduct[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: 'US$0',
    features: FREE_FEATURES,
  },
  {
    id: 'pro_annual',
    name: 'Pro Annual',
    priceLabel: PRO_ANNUAL_PRICE,
    features: PRO_FEATURES,
  },
  {
    id: 'lifetime',
    name: 'Lifetime Unlock',
    priceLabel: LIFETIME_PRICE,
    features: PRO_FEATURES,
  },
];
