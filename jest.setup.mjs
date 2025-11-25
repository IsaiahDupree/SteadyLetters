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

console.log('✅ Jest environment setup complete');
console.log('📦 Test environment variables loaded');
console.log('🔧 Global mocks initialized');

export const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
};

// Helper to create mock responses
export const mockResponse = (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
});

// Helper to create mock fetch
export const createMockFetch = () => {
    return async (url) => {
        if (url.includes('thanks.io')) {
            return mockResponse({ id: 'mock-order-id', status: 'queued' });
        }
        if (url.includes('openai.com')) {
            return mockResponse({ choices: [{ message: { content: 'Mock AI response' } }] });
        }
        if (url.includes('localhost:3000')) {
            return mockResponse({ success: true });
        }
        return mockResponse({});
    };
};
