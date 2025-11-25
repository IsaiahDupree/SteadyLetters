import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/settings/return-address/route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(() => ({
                data: { user: { id: 'test-user-id' } }
            }))
        }
    }))
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            update: vi.fn()
        }
    }
}));

describe('Return Address API', () => {
    it('updates return address successfully', async () => {
        const { prisma } = await import('@/lib/prisma');

        const reqBody = {
            returnName: 'John Doe',
            returnAddress1: '123 Main St',
            returnCity: 'New York',
            returnState: 'NY',
            returnZip: '10001',
            returnCountry: 'US'
        };

        const req = new NextRequest('http://localhost:3000/api/settings/return-address', {
            method: 'PATCH',
            body: JSON.stringify(reqBody)
        });

        (prisma.user.update as any).mockResolvedValue({ id: 'test-user-id', ...reqBody });

        const response = await PATCH(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'test-user-id' },
            data: expect.objectContaining({
                returnName: 'John Doe',
                returnAddress1: '123 Main St'
            })
        });
    });

    it('validates required fields', async () => {
        const reqBody = {
            returnName: 'J', // Too short
            returnAddress1: '123', // Too short
            returnCity: 'NY',
            returnState: 'NY',
            returnZip: '10001'
        };

        const req = new NextRequest('http://localhost:3000/api/settings/return-address', {
            method: 'PATCH',
            body: JSON.stringify(reqBody)
        });

        const response = await PATCH(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid data');
    });

    it('requires authentication', async () => {
        const { createClient } = await import('@/lib/supabase/server');

        // Mock no user
        (createClient as any).mockReturnValueOnce({
            auth: {
                getUser: vi.fn(() => ({ data: { user: null } }))
            }
        });

        const req = new NextRequest('http://localhost:3000/api/settings/return-address', {
            method: 'PATCH',
            body: JSON.stringify({
                returnName: 'John Doe',
                returnAddress1: '123 Main St',
                returnCity: 'New York',
                returnState: 'NY',
                returnZip: '10001'
            })
        });

        const response = await PATCH(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });
});
