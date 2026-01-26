/**
 * Meta Pixel Provider Component
 *
 * Initializes Meta Pixel and tracks page views on navigation
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initMetaPixel, trackPageView } from '@/lib/meta-pixel';

export function MetaPixelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Meta Pixel on mount
  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

    if (pixelId) {
      initMetaPixel(pixelId);
      // Track initial page view
      trackPageView();
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      trackPageView();
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
