import { useCallback, useEffect, useState } from 'react';

import { countReportsCreatedInMonth } from '@/repositories/reportRepository';
import type { EntitlementState } from '@/types/entitlement';

import { getMonthKey } from './entitlementRules';
import { localEntitlementProvider } from './localEntitlementProvider';

export interface UseEntitlementResult {
  entitlement: EntitlementState | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useEntitlement(): UseEntitlementResult {
  const [entitlement, setEntitlement] = useState<EntitlementState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const reportsCreatedThisMonth = await countReportsCreatedInMonth(getMonthKey());
    const next = await localEntitlementProvider.load(reportsCreatedThisMonth);
    setEntitlement(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  return { entitlement, loading, refresh };
}
