import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { apiError, apiErrorFromException, ApiErrors } from '../../src/lib/api-errors.js';

/**
 * Unit Test Suite for API Error Utilities
 *
 * Tests the standardized API error response functions
 */

describe('API Error Utilities', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('apiError', () => {
    test('should create a basic error response', async () => {
      const response = apiError('Something went wrong', 500);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({
        error: 'Something went wrong',
      });
    });

    test('should use default status 500', async () => {
      const response = apiError('Error');
      expect(response.status).toBe(500);
    });

    test('should include details in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const response = apiError('Error', 400, { field: 'email', reason: 'invalid' });
      const body = await response.json();

      expect(body).toEqual({
        error: 'Error',
        details: { field: 'email', reason: 'invalid' },
      });
    });

    test('should not include details in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const response = apiError('Error', 400, { field: 'email', reason: 'invalid' });
      const body = await response.json();

      expect(body).toEqual({
        error: 'Error',
      });
      expect(body).not.toHaveProperty('details');
    });

    test('should handle various status codes', async () => {
      const codes = [400, 401, 403, 404, 409, 429, 500, 503];

      for (const code of codes) {
        const response = apiError('Error', code);
        expect(response.status).toBe(code);
      }
    });
  });

  describe('apiErrorFromException', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should create error from exception', async () => {
      const exception = new Error('Database connection failed');
      const response = apiErrorFromException('Failed to fetch data', exception);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch data');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch data', exception);
    });

    test('should include exception details in development', async () => {
      process.env.NODE_ENV = 'development';
      const exception = new Error('Database error');
      const response = apiErrorFromException('Failed', exception);
      const body = await response.json();

      expect(body.details).toBeDefined();
      expect(body.type).toBe('Error');
    });

    test('should not include exception details in production', async () => {
      process.env.NODE_ENV = 'production';
      const exception = new Error('Database error');
      const response = apiErrorFromException('Failed', exception);
      const body = await response.json();

      expect(body).not.toHaveProperty('details');
      expect(body).not.toHaveProperty('type');
    });

    test('should handle custom status codes', async () => {
      const exception = new Error('Validation error');
      const response = apiErrorFromException('Invalid input', exception, 400);

      expect(response.status).toBe(400);
    });

    test('should handle non-Error exceptions', async () => {
      const exception = 'String error';
      const response = apiErrorFromException('Failed', exception);
      const body = await response.json();

      expect(body.error).toBe('Failed');
    });
  });

  describe('ApiErrors helpers', () => {
    describe('badRequest', () => {
      test('should create 400 error', async () => {
        const response = ApiErrors.badRequest();
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe('Bad request');
      });

      test('should accept custom message', async () => {
        const response = ApiErrors.badRequest('Invalid email format');
        const body = await response.json();

        expect(body.error).toBe('Invalid email format');
      });

      test('should include details', async () => {
        process.env.NODE_ENV = 'development';
        const response = ApiErrors.badRequest('Invalid input', { field: 'email' });
        const body = await response.json();

        expect(body.details).toEqual({ field: 'email' });
      });
    });

    describe('unauthorized', () => {
      test('should create 401 error', async () => {
        const response = ApiErrors.unauthorized();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('Unauthorized. Please sign in.');
      });

      test('should accept custom message', async () => {
        const response = ApiErrors.unauthorized('Session expired');
        const body = await response.json();

        expect(body.error).toBe('Session expired');
      });
    });

    describe('forbidden', () => {
      test('should create 403 error', async () => {
        const response = ApiErrors.forbidden();
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toContain('Forbidden');
      });
    });

    describe('notFound', () => {
      test('should create 404 error', async () => {
        const response = ApiErrors.notFound();
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.error).toBe('Resource not found');
      });

      test('should accept custom message', async () => {
        const response = ApiErrors.notFound('User not found');
        const body = await response.json();

        expect(body.error).toBe('User not found');
      });
    });

    describe('conflict', () => {
      test('should create 409 error', async () => {
        const response = ApiErrors.conflict();
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.error).toContain('Conflict');
      });
    });

    describe('tooManyRequests', () => {
      test('should create 429 error', async () => {
        const response = ApiErrors.tooManyRequests();

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe('60');
      });

      test('should accept custom retry-after', async () => {
        const response = ApiErrors.tooManyRequests(
          'Rate limit exceeded',
          120
        );

        expect(response.headers.get('Retry-After')).toBe('120');
      });

      test('should accept custom message', async () => {
        const response = ApiErrors.tooManyRequests('Slow down!');
        const body = await response.json();

        expect(body.error).toBe('Slow down!');
      });
    });

    describe('internalError', () => {
      test('should create 500 error', async () => {
        const response = ApiErrors.internalError();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toContain('Internal server error');
      });

      test('should include details in development', async () => {
        process.env.NODE_ENV = 'development';
        const response = ApiErrors.internalError('Database error', {
          query: 'SELECT * FROM users',
        });
        const body = await response.json();

        expect(body.details).toEqual({ query: 'SELECT * FROM users' });
      });
    });

    describe('serviceUnavailable', () => {
      test('should create 503 error', async () => {
        const response = ApiErrors.serviceUnavailable();
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.error).toContain('Service temporarily unavailable');
      });

      test('should accept custom message', async () => {
        const response = ApiErrors.serviceUnavailable('Maintenance in progress');
        const body = await response.json();

        expect(body.error).toBe('Maintenance in progress');
      });
    });
  });

  describe('Response format consistency', () => {
    test('should always have error field', async () => {
      const errors = [
        ApiErrors.badRequest(),
        ApiErrors.unauthorized(),
        ApiErrors.forbidden(),
        ApiErrors.notFound(),
        ApiErrors.tooManyRequests(),
        ApiErrors.internalError(),
        ApiErrors.serviceUnavailable(),
      ];

      for (const response of errors) {
        const body = await response.json();
        expect(body).toHaveProperty('error');
        expect(typeof body.error).toBe('string');
      }
    });

    test('should only include details in development', async () => {
      process.env.NODE_ENV = 'production';
      const response = apiError('Error', 500, { sensitive: 'data' });
      const body = await response.json();

      expect(body).not.toHaveProperty('details');

      process.env.NODE_ENV = 'development';
      const devResponse = apiError('Error', 500, { sensitive: 'data' });
      const devBody = await devResponse.json();

      expect(devBody).toHaveProperty('details');
    });
  });
});
