/**
 * Backend Unit Tests
 * Tests for backend API routes and utilities
 */

import { describe, it, expect } from 'vitest';

describe('Backend Health', () => {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

    it('should have health endpoint', async () => {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        expect(response.ok).toBe(true);
    });

    it('should return JSON response', async () => {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        const data = await response.json();
        expect(data).toHaveProperty('status');
        expect(data.status).toBe('ok');
    });

    it('should include timestamp', async () => {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        const data = await response.json();
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.timestamp).toBe('string');
    });
});

