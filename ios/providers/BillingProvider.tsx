import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type PurchasesOfferings,
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';
import { REVENUECAT_API_KEY, TIERS, type TierName } from '@/constants/config';
import { useAuth } from '@/providers/AuthProvider';

interface BillingContextType {
  tier: TierName;
  isSubscribed: boolean;
  offerings: PurchasesOfferings | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  isLoading: boolean;
  canUseProduct: (productType: string) => boolean;
  checkUsageLimit: (usage: number, field: keyof typeof TIERS.free) => boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

function determineTier(customerInfo: CustomerInfo): TierName {
  const entitlements = customerInfo.entitlements.active;
  if (entitlements['business']) return 'business';
  if (entitlements['pro']) return 'pro';
  return 'free';
}

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<TierName>('free');
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isConfigured = Boolean(REVENUECAT_API_KEY);

  // Initialize RevenueCat on mount
  useEffect(() => {
    if (!isConfigured) {
      console.warn('BillingProvider: REVENUECAT_API_KEY not set — defaulting to free tier');
      setIsLoading(false);
      return;
    }
    async function init() {
      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });

        const fetchedOfferings = await Purchases.getOfferings();
        setOfferings(fetchedOfferings);

        const customerInfo = await Purchases.getCustomerInfo();
        setTier(determineTier(customerInfo));
      } catch (error) {
        console.error('BillingProvider init error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [isConfigured]);

  // Identify user when auth changes
  useEffect(() => {
    if (!isConfigured) return;
    async function identify() {
      if (!user?.id) return;
      try {
        const { customerInfo } = await Purchases.logIn(user.id);
        setTier(determineTier(customerInfo));
      } catch (error) {
        console.error('RevenueCat identify error:', error);
      }
    }
    identify();
  }, [user?.id, isConfigured]);

  // Listen for customer info updates
  useEffect(() => {
    if (!isConfigured) return;
    const listener = (info: CustomerInfo) => {
      setTier(determineTier(info));
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (!isConfigured) {
      throw new Error('In-app purchases are not configured yet. Please try again later.');
    }
    setIsLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setTier(determineTier(customerInfo));
    } catch (error: any) {
      if (!error.userCancelled) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  const restorePurchases = useCallback(async () => {
    if (!isConfigured) {
      throw new Error('In-app purchases are not configured yet. Please try again later.');
    }
    setIsLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      setTier(determineTier(customerInfo));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  const isSubscribed = tier !== 'free';

  const canUseProduct = useCallback(
    (productType: string): boolean => {
      const tierConfig = TIERS[tier];
      return tierConfig.products.includes(productType as any);
    },
    [tier],
  );

  const checkUsageLimit = useCallback(
    (usage: number, field: keyof typeof TIERS.free): boolean => {
      const limit = TIERS[tier][field];
      if (typeof limit !== 'number') return false;
      if (limit === -1) return true; // unlimited
      return usage < limit;
    },
    [tier],
  );

  return (
    <BillingContext.Provider
      value={{
        tier,
        isSubscribed,
        offerings,
        purchasePackage,
        restorePurchases,
        isLoading,
        canUseProduct,
        checkUsageLimit,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) throw new Error('useBilling must be used within BillingProvider');
  return context;
}
