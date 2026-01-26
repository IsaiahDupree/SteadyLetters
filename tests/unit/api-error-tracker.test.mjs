/**
 * Tests for API Error Tracker
 * @jest-environment node
 */
import { jest } from '@jest/globals';

// Mock tracking module
const mockTrack = jest.fn();
const mockTrackErrorShown = jest.fn();

jest.unstable_mockModule('../../src/lib/tracking.js', () => ({
  tracking: {
    track: mockTrack,
    trackErrorShown: mockTrackErrorShown,
  },
}));

// Now import the module under test
const { trackAPIError, trackSlowAPI } = await import('../../src/lib/api-error-tracker.js');

describe('API Error Tracker', () => {
  beforeEach(() => {
    mockTrack.mockClear();
    mockTrackErrorShown.mockClear();
  });

  describe('trackAPIError', () => {
    test('should track API error with correct severity for 500 errors', () => {
      trackAPIError({
        endpoint: '/api/generate/letter',
        method: 'POST',
        statusCode: 500,
        errorMessage: 'Internal server error',
        responseTime: 1500,
      });

      expect(mockTrackErrorShown).toHaveBeenCalledWith({
        error_type: 'api_error',
        error_message: 'POST /api/generate/letter: Internal server error',
        severity: 'high',
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'api_error',
        expect.objectContaining({
          endpoint: '/api/generate/letter',
          method: 'POST',
          status_code: 500,
          error_message: 'Internal server error',
          response_time: 1500,
        })
      );
    });

    test('should track API error with medium severity for 400 errors', () => {
      trackAPIError({
        endpoint: '/api/recipients',
        method: 'GET',
        statusCode: 404,
        errorMessage: 'Not found',
        responseTime: 200,
      });

      expect(mockTrackErrorShown).toHaveBeenCalledWith({
        error_type: 'api_error',
        error_message: 'GET /api/recipients: Not found',
        severity: 'medium',
      });
    });

    test('should track network error without status code', () => {
      trackAPIError({
        endpoint: '/api/orders',
        method: 'POST',
        errorMessage: 'Network error',
      });

      expect(mockTrackErrorShown).toHaveBeenCalledWith({
        error_type: 'api_error',
        error_message: 'POST /api/orders: Network error',
        severity: 'medium',
      });
    });
  });

  describe('trackSlowAPI', () => {
    test('should track slow API request over 2 seconds', () => {
      trackSlowAPI({
        endpoint: '/api/generate/letter',
        method: 'POST',
        responseTime: 3000,
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'api_slow',
        expect.objectContaining({
          endpoint: '/api/generate/letter',
          method: 'POST',
          response_time: 3000,
          severity: 'medium',
        })
      );
    });

    test('should track very slow API request over 5 seconds with high severity', () => {
      trackSlowAPI({
        endpoint: '/api/generate/images',
        method: 'POST',
        responseTime: 6000,
      });

      expect(mockTrack).toHaveBeenCalledWith(
        'api_slow',
        expect.objectContaining({
          endpoint: '/api/generate/images',
          method: 'POST',
          response_time: 6000,
          severity: 'high',
        })
      );
    });

    test('should not track fast API request under 2 seconds', () => {
      trackSlowAPI({
        endpoint: '/api/recipients',
        method: 'GET',
        responseTime: 500,
      });

      expect(mockTrack).not.toHaveBeenCalled();
    });
  });
});
