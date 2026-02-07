/**
 * Unit tests for Thanks.io Order Status API integration
 * Tests the getOrderStatus() function
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment setup
const ORIGINAL_ENV = process.env;
const MOCK_API_KEY = 'test_api_key_12345';
const BASE_URL = 'https://api.thanks.io/api/v2';

describe('Thanks.io Order Status API', () => {
  beforeEach(() => {
    // Reset environment
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, THANKS_IO_API_KEY: MOCK_API_KEY };

    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  describe('getOrderStatus()', () => {
    it('should fetch order status from Thanks.io API', async () => {
      const mockOrderId = 'tio_abc123';
      const mockResponse = {
        id: mockOrderId,
        status: 'sent',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
        estimated_delivery: '2026-01-07T00:00:00Z',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getOrderStatus } = await import('@/lib/thanks-io');
      const result = await getOrderStatus(mockOrderId);

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/order/${mockOrderId}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${MOCK_API_KEY}`,
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual({
        id: mockOrderId,
        status: 'sent',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
        delivered_at: undefined,
        estimated_delivery: '2026-01-07T00:00:00Z',
        tracking_number: undefined,
        error: undefined,
        message: undefined,
      });
    });

    it('should return null for 404 not found', async () => {
      const mockOrderId = 'tio_nonexistent';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const { getOrderStatus } = await import('@/lib/thanks-io');
      const result = await getOrderStatus(mockOrderId);

      expect(result).toBeNull();
    });

    it('should handle delivered status with delivery date', async () => {
      const mockOrderId = 'tio_delivered123';
      const mockResponse = {
        id: mockOrderId,
        status: 'delivered',
        created_at: '2026-01-01T00:00:00Z',
        delivered_at: '2026-01-05T14:30:00Z',
        tracking_number: 'USPS1234567890',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getOrderStatus } = await import('@/lib/thanks-io');
      const result = await getOrderStatus(mockOrderId);

      expect(result?.status).toBe('delivered');
      expect(result?.delivered_at).toBe('2026-01-05T14:30:00Z');
      expect(result?.tracking_number).toBe('USPS1234567890');
    });

    it('should handle failed status with error message', async () => {
      const mockOrderId = 'tio_failed123';
      const mockResponse = {
        id: mockOrderId,
        status: 'failed',
        error: 'Invalid address',
        message: 'The recipient address could not be validated',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getOrderStatus } = await import('@/lib/thanks-io');
      const result = await getOrderStatus(mockOrderId);

      expect(result?.status).toBe('failed');
      expect(result?.error).toBe('Invalid address');
      expect(result?.message).toBe('The recipient address could not be validated');
    });

    it('should return mock data when API key is missing', async () => {
      process.env.THANKS_IO_API_KEY = '';
      vi.resetModules();

      const { getOrderStatus } = await import('@/lib/thanks-io');
      const result = await getOrderStatus('test_order_id');

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result?.id).toBe('test_order_id');
      expect(result?.status).toBe('processing');
      expect(result?.estimated_delivery).toBeDefined();
    });

    it('should throw error for non-404 API errors', async () => {
      const mockOrderId = 'tio_error123';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { getOrderStatus } = await import('@/lib/thanks-io');

      await expect(getOrderStatus(mockOrderId)).rejects.toThrow('Failed to fetch order status');
    });

    it('should handle API response with expected_delivery_date field', async () => {
      const mockOrderId = 'tio_abc123';
      const mockResponse = {
        id: mockOrderId,
        status: 'processing',
        expected_delivery_date: '2026-01-10T00:00:00Z', // Alternative field name
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getOrderStatus } = await import('@/lib/thanks-io');
      const result = await getOrderStatus(mockOrderId);

      expect(result?.estimated_delivery).toBe('2026-01-10T00:00:00Z');
    });

    it('should handle queued status', async () => {
      const mockOrderId = 'tio_queued123';
      const mockResponse = {
        id: mockOrderId,
        status: 'queued',
        created_at: '2026-01-01T00:00:00Z',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getOrderStatus } = await import('@/lib/thanks-io');
      const result = await getOrderStatus(mockOrderId);

      expect(result?.status).toBe('queued');
      expect(result?.created_at).toBe('2026-01-01T00:00:00Z');
    });
  });
});
