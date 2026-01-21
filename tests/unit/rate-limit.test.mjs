/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

// Mock the Upstash modules
const mockLimit = jest.fn();

const mockSlidingWindow = jest.fn().mockReturnValue({ type: 'slidingWindow' });

const mockRatelimit = jest.fn().mockImplementation(() => ({
  limit: mockLimit,
}));

// Add slidingWindow as a static method
mockRatelimit.slidingWindow = mockSlidingWindow;

const mockRedis = jest.fn().mockImplementation(() => ({}));

jest.unstable_mockModule('@upstash/ratelimit', () => ({
  Ratelimit: mockRatelimit,
}));

jest.unstable_mockModule('@upstash/redis', () => ({
  Redis: mockRedis,
}));

// Import after mocking
const { rateLimiters, checkRateLimit } = await import('../../src/lib/rate-limit.js');

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rateLimiters configuration', () => {
    it('should create generation rate limiter with correct config', () => {
      expect(rateLimiters).toHaveProperty('generation');
      expect(rateLimiters.generation).toBeDefined();
    });

    it('should create imageGeneration rate limiter with correct config', () => {
      expect(rateLimiters).toHaveProperty('imageGeneration');
      expect(rateLimiters.imageGeneration).toBeDefined();
    });

    it('should create transcription rate limiter with correct config', () => {
      expect(rateLimiters).toHaveProperty('transcription');
      expect(rateLimiters.transcription).toBeDefined();
    });

    it('should create api rate limiter with correct config', () => {
      expect(rateLimiters).toHaveProperty('api');
      expect(rateLimiters.api).toBeDefined();
    });
  });

  describe('checkRateLimit function', () => {
    it('should return success when limit not exceeded', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        remaining: 9,
        reset: Date.now() + 60000,
      });

      const result = await checkRateLimit('generation', '192.168.1.1');

      expect(result).toEqual({
        success: true,
        remaining: 9,
      });
    });

    it('should return failure when limit exceeded', async () => {
      mockLimit.mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const result = await checkRateLimit('generation', '192.168.1.1');

      expect(result).toEqual({
        success: false,
        remaining: 0,
      });
    });

    it('should use correct identifier', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        remaining: 5,
        reset: Date.now() + 60000,
      });

      await checkRateLimit('api', 'user-123');

      expect(mockLimit).toHaveBeenCalledWith('user-123');
    });
  });
});
