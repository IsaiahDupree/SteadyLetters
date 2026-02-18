import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '@/constants/config';
import { useAuth } from '@/providers/AuthProvider';
import { setPostHogCapture } from '@/services/events';

interface AnalyticsContextType {
  capture: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

function AnalyticsSync({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog();
  const { user } = useAuth();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.email ?? '',
        created_at: user.created_at ?? '',
      });
      previousUserId.current = user.id;
    } else if (previousUserId.current) {
      posthog.reset();
      previousUserId.current = null;
    }
  }, [user, posthog]);

  const capture = useCallback(
    (event: string, properties?: Record<string, any>) => {
      posthog.capture(event, properties);
    },
    [posthog],
  );

  // Bridge PostHog capture to the unified events service
  useEffect(() => {
    setPostHogCapture(capture);
  }, [capture]);

  const identify = useCallback(
    (userId: string, traits?: Record<string, any>) => {
      posthog.identify(userId, traits);
    },
    [posthog],
  );

  const reset = useCallback(() => {
    posthog.reset();
  }, [posthog]);

  return (
    <AnalyticsContext.Provider value={{ capture, identify, reset }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_API_KEY) {
    return (
      <AnalyticsContext.Provider
        value={{
          capture: () => {},
          identify: () => {},
          reset: () => {},
        }}
      >
        {children}
      </AnalyticsContext.Provider>
    );
  }

  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        enableSessionReplay: true,
      }}
      autocapture={{
        captureScreens: true,
        captureTouches: true,
        captureLifecycleEvents: true,
      }}
    >
      <AnalyticsSync>{children}</AnalyticsSync>
    </PostHogProvider>
  );
}

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
}
