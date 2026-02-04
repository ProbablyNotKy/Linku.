import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubscriptionStatus, checkFeatureAccess } from '@/lib/api';
import type { Subscription, FeatureAccess, PremiumFeature } from '@/lib/api';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  isPremium: boolean;
  tier: 'free' | 'premium';
  error: string | null;
  refresh: () => Promise<void>;
  checkFeature: (feature: PremiumFeature) => Promise<FeatureAccess>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { session, user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!session?.access_token || !user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sub = await getSubscriptionStatus(session.access_token);
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const checkFeature = useCallback(async (feature: PremiumFeature): Promise<FeatureAccess> => {
    if (!session?.access_token) {
      return {
        has_access: false,
        tier: 'free',
        message: 'Please sign in to access this feature',
        upgrade_required: true,
      };
    }

    try {
      return await checkFeatureAccess(feature, session.access_token);
    } catch (err) {
      console.error('Failed to check feature access:', err);
      return {
        has_access: false,
        tier: subscription?.tier || 'free',
        message: 'Failed to verify access',
        upgrade_required: false,
      };
    }
  }, [session?.access_token, subscription?.tier]);

  return {
    subscription,
    isLoading,
    isPremium: subscription?.is_premium || false,
    tier: subscription?.tier || 'free',
    error,
    refresh: fetchSubscription,
    checkFeature,
  };
}
