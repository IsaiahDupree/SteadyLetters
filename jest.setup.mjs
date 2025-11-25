// Jest Setup File - Global Mocks and Configuration

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.THANKS_IO_API_KEY = 'test-thanks-io-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GOOGLE_AI_API_KEY = 'test-google-ai-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Supabase Client
const mockSupabaseClient = {
    auth: {
        getUser: jest.fn(() => Promise.resolve({
            data: {
                user: {
                    id: 'test-user-id',
                    email: 'test@example.com',
                    user_metadata: {},
                },
            },
            error: null,
        })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
};

// Mock Supabase createClient
jest.mock('@supabase/ssr', () => ({
    createServerClient: jest.fn(() => mockSupabaseClient),
    createBrowserClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/supabase/client', () => ({
    createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Prisma Client
const mockPrismaClient = {
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    userUsage: {
        findUnique: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
    },
    recipient: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    template: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
    mailOrder: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
    $disconnect: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
    prisma: mockPrismaClient,
}));

// Mock API Auth Helper
jest.mock('@/lib/api-auth', () => ({
    getAuthenticatedUser: jest.fn(async () => ({
        id: 'test-user-id',
        email: 'test@example.com',
    })),
}));

// Mock fetch for external API calls
global.fetch = jest.fn((url) => {
    // Mock Thanks.io API
    if (url.includes('thanks.io')) {
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                id: 'mock-order-id',
                status: 'queued',
            }),
        });
    }

    // Mock OpenAI API
    if (url.includes('openai.com')) {
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                choices: [{ text: 'Mock AI response', message: { content: 'Mock response' } }],
            }),
        });
    }

    // Mock local API endpoints
    if (url.includes('localhost:3000')) {
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true }),
            text: () => Promise.resolve('OK'),
        });
    }

    // Default mock response
    return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
    });
});

// Console spy to reduce noise in tests
global.console = {
    ...console,
    error: jest.fn(console.error),
    warn: jest.fn(console.warn),
};

export { mockSupabaseClient, mockPrismaClient };
