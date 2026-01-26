'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { tracking } from '@/lib/tracking';

/**
 * Web Vitals Tracker Component
 *
 * Tracks Core Web Vitals and reports them to PostHog:
 * - CLS (Cumulative Layout Shift)
 * - FID (First Input Delay)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */
export function WebVitalsTracker() {
  useReportWebVitals((metric) => {
    // Track web vital metrics
    tracking.track('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_id: metric.id,
      metric_rating: metric.rating,
      page_url: window.location.href,
      page_pathname: window.location.pathname,
    });

    // Also track specific vitals as separate events for easier querying
    switch (metric.name) {
      case 'CLS':
        tracking.track('web_vital_cls', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname,
        });
        break;
      case 'FID':
        tracking.track('web_vital_fid', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname,
        });
        break;
      case 'FCP':
        tracking.track('web_vital_fcp', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname,
        });
        break;
      case 'LCP':
        tracking.track('web_vital_lcp', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname,
        });
        break;
      case 'TTFB':
        tracking.track('web_vital_ttfb', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname,
        });
        break;
      case 'INP':
        tracking.track('web_vital_inp', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname,
        });
        break;
    }
  });

  return null; // This component doesn't render anything
}
