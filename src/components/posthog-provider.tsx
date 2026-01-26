'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, trackPageView } from '@/lib/posthog';
import { tracking } from '@/lib/tracking';

const LAST_SESSION_KEY = 'sl_last_session';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();

    // Track return sessions
    const lastSessionStr = localStorage.getItem(LAST_SESSION_KEY);
    const now = Date.now();

    if (lastSessionStr) {
      const lastSession = parseInt(lastSessionStr, 10);
      const daysSinceLastSession = Math.floor((now - lastSession) / (1000 * 60 * 60 * 24));

      // Only track as return session if more than 1 hour since last session
      if (now - lastSession > 60 * 60 * 1000) {
        tracking.trackReturnSession({ days_since_last_session: daysSinceLastSession });
      }
    }

    // Update last session timestamp
    localStorage.setItem(LAST_SESSION_KEY, now.toString());
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = window.origin + pathname;
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
