/**
 * API Error Tracking Utility
 *
 * Tracks API failures and performance issues
 */

import { tracking } from './tracking.js';

/**
 * Track API errors
 */
export function trackAPIError(details) {
  tracking.trackErrorShown({
    error_type: 'api_error',
    error_message: `${details.method} ${details.endpoint}: ${details.errorMessage}`,
    severity: details.statusCode && details.statusCode >= 500 ? 'high' : 'medium',
  });

  // Also track as a custom event with more details
  tracking.track('api_error', {
    endpoint: details.endpoint,
    method: details.method,
    status_code: details.statusCode,
    error_message: details.errorMessage,
    response_time: details.responseTime,
  });
}

/**
 * Track slow API requests (>2s)
 */
export function trackSlowAPI(details) {
  if (details.responseTime > 2000) {
    tracking.track('api_slow', {
      endpoint: details.endpoint,
      method: details.method,
      response_time: details.responseTime,
      severity: details.responseTime > 5000 ? 'high' : 'medium',
    });
  }
}

/**
 * Wrapper for fetch that tracks errors and performance
 */
export async function trackedFetch(url, options) {
  const startTime = performance.now();
  const method = options?.method || 'GET';

  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Track slow requests
    trackSlowAPI({
      endpoint: url,
      method,
      responseTime,
    });

    // Track API errors
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.clone().json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use statusText
      }

      trackAPIError({
        endpoint: url,
        method,
        statusCode: response.status,
        errorMessage,
        responseTime,
      });
    }

    return response;
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    trackAPIError({
      endpoint: url,
      method,
      errorMessage: error.message || 'Network error',
      responseTime,
    });

    throw error;
  }
}
