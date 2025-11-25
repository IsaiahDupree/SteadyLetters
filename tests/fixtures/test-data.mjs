/**
 * Test data fixtures for comprehensive testing
 * Includes test cases for letter generation, audio files, images, etc.
 */

// Letter generation test cases - all tone/occasion combinations
export const TONES = ['professional', 'friendly', 'formal', 'casual', 'heartfelt'];

export const OCCASIONS = [
    'birthday',
    'anniversary',
    'thank-you',
    'congratulations',
    'sympathy',
    'holiday',
    'general',
    'love',
];

export const HOLIDAYS = [
    'christmas',
    'thanksgiving',
    'new-year',
    'valentines',
    'mothers-day',
    'fathers-day',
    'easter',
    'halloween',
];

// Generate all tone/occasion combinations
export const LETTER_TEST_CASES = [];
for (const tone of TONES) {
    for (const occasion of OCCASIONS) {
        LETTER_TEST_CASES.push({
            tone,
            occasion,
            context: `A ${tone} message for a ${occasion} occasion`,
            holiday: occasion === 'holiday' ? 'christmas' : undefined,
        });
    }
}

// High-priority test cases (subset for faster testing)
export const HIGH_PRIORITY_CASES = [
    { tone: 'professional', occasion: 'thank-you', context: 'Thanking a client for their business' },
    { tone: 'friendly', occasion: 'birthday', context: 'Wishing my friend a happy birthday' },
    { tone: 'formal', occasion: 'congratulations', context: 'Congratulating a colleague on their promotion' },
    { tone: 'casual', occasion: 'general', context: 'Just saying hello to a friend' },
    { tone: 'heartfelt', occasion: 'sympathy', context: 'Expressing condolences for a loss' },
    { tone: 'friendly', occasion: 'anniversary', context: 'Celebrating our anniversary' },
    { tone: 'heartfelt', occasion: 'love', context: 'Expressing love to my partner' },
    { tone: 'professional', occasion: 'holiday', context: 'Season\'s greetings to business partners', holiday: 'christmas' },
];

// Sample audio test data (base64 encoded minimal webm)
// This is a minimal valid WebM file header
export const MINIMAL_WEBM_BASE64 = 'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh1oAAAAAAAAAAABZU++u';

// Image test data
export const TEST_IMAGES = {
    // 1x1 red PNG
    SMALL_PNG: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwDwAFAgH/VscvDQAAAABJRU5ErkJggg==',
    // 1x1 blue JPEG
    SMALL_JPG: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/GVAA/9k=',
};

// Test contexts for different input methods
export const VOICE_TEST_CONTEXT = 'I want to send a letter congratulating my friend on their new job as a software engineer';
export const IMAGE_TEST_CONTEXT = 'This is a photo of my dog that I want to reference in a birthday card';
export const TEXT_TEST_CONTEXT = 'I want to thank my mentor for all their guidance and support throughout my career';

// Recipient test data
export const TEST_RECIPIENT = {
    name: 'John Doe',
    email: 'john.doe.test@example.com',
    street1: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zip: '12345',
    country: 'US',
};

// Expected generation times (for performance testing)
export const PERFORMANCE_BENCHMARKS = {
    letterGeneration: 3000, // ms
    voiceTranscription: 5000, // ms for 1min audio
    imageAnalysis: 2000, // ms
    stripeCheckout: 1000, // ms
};

// Usage limits by tier (for quota testing)
export const TIER_LIMITS = {
    FREE: {
        lettersPerMonth: 5,
        imagesPerMonth: 10,
        mailsPerMonth: 3,
        voicePerMonth: 5,
        imageAnalysisPerMonth: 5,
    },
    PRO: {
        lettersPerMonth: 50,
        imagesPerMonth: 100,
        mailsPerMonth: 10,
        voicePerMonth: Infinity,
        imageAnalysisPerMonth: Infinity,
    },
    BUSINESS: {
        lettersPerMonth: 200,
        imagesPerMonth: 400,
        mailsPerMonth: 50,
        voicePerMonth: Infinity,
        imageAnalysisPerMonth: Infinity,
    },
};

// Export helper to create test audio Blob
export function createTestAudioBlob(durationSeconds = 1) {
    // Create minimal WebM blob
    const binary = atob(MINIMAL_WEBM_BASE64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'audio/webm' });
}

// Export helper to create test image Blob
export function createTestImageBlob(type = 'png') {
    const base64 = type === 'png' ? TEST_IMAGES.SMALL_PNG : TEST_IMAGES.SMALL_JPG;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: `image/${type}` });
}
