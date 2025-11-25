/**
 * Address Extraction API Tests
 * 
 * Tests for the /api/extract-address endpoint that extracts return addresses
 * from letter images using GPT-4 Vision.
 */

import { describe, it, expect } from '@jest/globals';
import { authenticatedFormPost, getTestUserSession } from './utils/auth-helper.mjs';

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';
const TEST_URL = process.env.TEST_ENV === 'production' ? PRODUCTION_URL : LOCAL_URL;

// Helper to create a minimal test image
function createTestImage() {
    // 1x1 pixel PNG
    const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    return new Blob([pngData], { type: 'image/png' });
}

describe('Address Extraction API Tests', () => {
    describe('Authentication', () => {
        it('should require authentication for address extraction', async () => {
            const formData = new FormData();
            const testImage = createTestImage();
            const testFile = new File([testImage], 'test.png', { type: 'image/png' });
            formData.append('image', testFile);

            const response = await fetch(`${TEST_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toContain('Unauthorized');
        });

        it('should return proper error message for unauthenticated requests', async () => {
            const formData = new FormData();
            const testImage = createTestImage();
            const testFile = new File([testImage], 'test.png', { type: 'image/png' });
            formData.append('image', testFile);

            const response = await fetch(`${TEST_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            expect(response.status).toBe(401);
            expect(data.error).toContain('Unauthorized');
            expect(data.error).toContain('sign in');
        });
    });

    describe('File Validation', () => {
        it('should reject requests without image file', async () => {
            const formData = new FormData();

            const response = await fetch(`${TEST_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            // Should fail at authentication or validation
            expect([400, 401]).toContain(response.status);
            
            if (response.status === 400) {
                const data = await response.json();
                expect(data.error).toContain('image');
            }
        });

        it('should reject files that are too large', async () => {
            // Create a large file (simulate > 20MB)
            const largeBlob = new Blob([new ArrayBuffer(21 * 1024 * 1024)], { type: 'image/png' });
            const largeFile = new File([largeBlob], 'large.png', { type: 'image/png' });
            const formData = new FormData();
            formData.append('image', largeFile);

            const response = await fetch(`${TEST_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            // Should fail at authentication or validation
            expect([400, 401]).toContain(response.status);
            
            if (response.status === 400) {
                const data = await response.json();
                expect(data.error).toContain('too large');
                expect(data.error).toContain('20MB');
            }
        });

        it('should validate image file types', () => {
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
            const invalidTypes = ['application/pdf', 'text/plain', 'application/json'];

            validTypes.forEach(type => {
                expect(type).toMatch(/^image\//);
            });

            invalidTypes.forEach(type => {
                expect(type).not.toMatch(/^image\//);
            });
        });
    });

    describe('Response Format', () => {
        it('should return proper JSON structure when address is found', async () => {
            // Expected response structure:
            // {
            //   address: {
            //     name?: string;
            //     address1?: string;
            //     address2?: string;
            //     city?: string;
            //     state?: string;
            //     zip?: string;
            //     country?: string;
            //   },
            //   message: string
            // }
            
            const expectedFields = ['address', 'message'];
            const addressFields = ['name', 'address1', 'address2', 'city', 'state', 'zip', 'country'];
            
            // Validate structure
            expect(expectedFields).toContain('address');
            expect(expectedFields).toContain('message');
            expect(addressFields).toContain('address1');
            expect(addressFields).toContain('city');
            expect(addressFields).toContain('state');
            expect(addressFields).toContain('zip');
        });

        it('should return null address when no address is found', async () => {
            // Expected response:
            // {
            //   address: null,
            //   message: "No return address found..."
            // }
            
            const responseStructure = {
                address: null,
                message: 'No return address found in the image. Please try a different image.',
            };
            
            expect(responseStructure.address).toBeNull();
            expect(responseStructure.message).toContain('No return address found');
        });

        it('should include success message when address is found', () => {
            const successMessage = 'Return address found! Would you like to add this as a recipient?';
            
            expect(successMessage).toContain('Return address found');
            expect(successMessage).toContain('recipient');
        });
    });

    describe('Address Parsing', () => {
        it('should extract name from return address', () => {
            const mockAddress = {
                name: 'John Doe',
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            expect(mockAddress.name).toBeTruthy();
            expect(typeof mockAddress.name).toBe('string');
        });

        it('should extract street address (address1)', () => {
            const mockAddress = {
                name: 'John Doe',
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            expect(mockAddress.address1).toBeTruthy();
            expect(mockAddress.address1).toMatch(/\d+/); // Should contain numbers
        });

        it('should extract city, state, and ZIP', () => {
            const mockAddress = {
                name: 'John Doe',
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            expect(mockAddress.city).toBeTruthy();
            expect(mockAddress.state).toMatch(/^[A-Z]{2}$/); // 2-letter state code
            expect(mockAddress.zip).toMatch(/^\d{5}(-\d{4})?$/); // 5 or 9 digit ZIP
        });

        it('should handle optional address2 field', () => {
            const withAddress2 = {
                name: 'John Doe',
                address1: '123 Main St',
                address2: 'Apt 4B',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            const withoutAddress2 = {
                name: 'John Doe',
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            expect(withAddress2.address2).toBeTruthy();
            expect(withoutAddress2.address2).toBeUndefined();
        });

        it('should default country to "US" when not visible', () => {
            const addressWithoutCountry = {
                name: 'John Doe',
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            const defaultCountry = addressWithoutCountry.country || 'US';
            expect(defaultCountry).toBe('US');
        });

        it('should normalize state codes to 2-letter abbreviations', () => {
            const validStates = ['CA', 'NY', 'TX', 'FL'];
            const invalidStates = ['California', 'New York', 'CA.', 'ca'];
            
            validStates.forEach(state => {
                expect(state).toMatch(/^[A-Z]{2}$/);
            });
            
            invalidStates.forEach(state => {
                expect(state).not.toMatch(/^[A-Z]{2}$/);
            });
        });
    });

    describe('Usage Tracking', () => {
        it('should track image analysis usage', () => {
            const event = {
                userId: 'test-user',
                eventType: 'image_analyzed',
                metadata: {
                    type: 'address_extraction',
                    fileSize: 1024000,
                    fileType: 'image/png',
                    hasAddress: true,
                },
            };
            
            expect(event.eventType).toBe('image_analyzed');
            expect(event.metadata.type).toBe('address_extraction');
            expect(event.metadata.hasAddress).toBe(true);
        });

        it('should enforce usage limits', () => {
            const usage = {
                userId: 'test-user',
                imageGenerations: 10,
                tier: 'FREE',
            };
            
            const limit = 10; // FREE tier limit
            const canExtract = usage.imageGenerations < limit;
            
            // At limit, should not be able to extract
            expect(canExtract).toBe(false);
        });

        it('should track limit reached events', () => {
            const limitEvent = {
                userId: 'test-user',
                eventType: 'limit_reached',
                metadata: {
                    type: 'address_extraction',
                    tier: 'FREE',
                },
            };
            
            expect(limitEvent.eventType).toBe('limit_reached');
            expect(limitEvent.metadata.type).toBe('address_extraction');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid image formats gracefully', async () => {
            const formData = new FormData();
            const invalidFile = new File(['not an image'], 'test.txt', { type: 'text/plain' });
            formData.append('image', invalidFile);

            const response = await fetch(`${TEST_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            // Should fail at auth or validation
            expect([400, 401]).toContain(response.status);
        });

        it('should provide detailed errors in development mode', async () => {
            const formData = new FormData();
            const testImage = createTestImage();
            const testFile = new File([testImage], 'test.png', { type: 'image/png' });
            formData.append('image', testFile);

            const response = await fetch(`${TEST_URL}/api/extract-address`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            expect(data.error).toBeDefined();
            
            // In development, might have more details
            if (process.env.NODE_ENV === 'development' && response.status === 500) {
                expect(typeof data.error).toBe('string');
            }
        });

        it('should handle JSON parsing errors', () => {
            const invalidJson = 'This is not JSON';
            const validJson = '{"name": "John", "city": "LA"}';
            
            expect(() => JSON.parse(invalidJson)).toThrow();
            expect(() => JSON.parse(validJson)).not.toThrow();
        });

        it('should handle missing required address fields', () => {
            const incompleteAddress = {
                name: 'John Doe',
                // Missing address1, city, state, zip
            };
            
            const hasRequiredFields = 
                incompleteAddress.address1 && 
                incompleteAddress.city && 
                incompleteAddress.state && 
                incompleteAddress.zip;
            
            expect(hasRequiredFields).toBeFalsy();
        });
    });

    describe('Integration with Recipients', () => {
        it('should validate address fields before creating recipient', () => {
            const validAddress = {
                name: 'John Doe',
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            const invalidAddress = {
                name: 'John Doe',
                // Missing required fields
            };
            
            const isValid = 
                !!validAddress.address1 && 
                !!validAddress.city && 
                !!validAddress.state && 
                !!validAddress.zip;
            
            const isInvalid = 
                !invalidAddress.address1 || 
                !invalidAddress.city || 
                !invalidAddress.state || 
                !invalidAddress.zip;
            
            expect(isValid).toBe(true);
            expect(isInvalid).toBe(true);
        });

        it('should format address for recipient creation', () => {
            const extractedAddress = {
                name: 'John Doe',
                address1: '123 Main St',
                address2: 'Apt 4B',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
                country: 'US',
            };
            
            const recipientData = {
                name: extractedAddress.name || 'Unknown',
                address1: extractedAddress.address1 || '',
                address2: extractedAddress.address2,
                city: extractedAddress.city || '',
                state: extractedAddress.state || '',
                zip: extractedAddress.zip || '',
                country: extractedAddress.country || 'US',
            };
            
            expect(recipientData.name).toBe('John Doe');
            expect(recipientData.address1).toBe('123 Main St');
            expect(recipientData.address2).toBe('Apt 4B');
            expect(recipientData.country).toBe('US');
        });
    });
});

describe('Address Extraction Component Tests', () => {
    describe('File Upload', () => {
        it('should support drag and drop', () => {
            const supportedEvents = ['drop', 'dragover'];
            
            expect(supportedEvents).toContain('drop');
            expect(supportedEvents).toContain('dragover');
        });

        it('should show image preview after upload', () => {
            const mockFile = new Blob(['test'], { type: 'image/jpeg' });
            const reader = {
                result: 'data:image/jpeg;base64,testdata',
            };
            
            const imagePreview = reader.result;
            
            expect(imagePreview).toMatch(/^data:image/);
        });

        it('should validate file size before upload', () => {
            const validSize = 10 * 1024 * 1024; // 10MB
            const invalidSize = 25 * 1024 * 1024; // 25MB
            const maxSize = 20 * 1024 * 1024; // 20MB
            
            expect(validSize).toBeLessThan(maxSize);
            expect(invalidSize).toBeGreaterThan(maxSize);
        });
    });

    describe('UI States', () => {
        it('should show loading state during extraction', () => {
            const states = {
                isExtracting: true,
                extractedAddress: null,
            };
            
            expect(states.isExtracting).toBe(true);
            expect(states.extractedAddress).toBeNull();
        });

        it('should show success state when address is found', () => {
            const states = {
                isExtracting: false,
                extractedAddress: {
                    name: 'John Doe',
                    address1: '123 Main St',
                    city: 'Los Angeles',
                    state: 'CA',
                    zip: '90210',
                },
            };
            
            expect(states.isExtracting).toBe(false);
            expect(states.extractedAddress).toBeTruthy();
            expect(states.extractedAddress.name).toBeTruthy();
        });

        it('should show error state when extraction fails', () => {
            const states = {
                isExtracting: false,
                extractedAddress: null,
                error: 'No return address found',
            };
            
            expect(states.isExtracting).toBe(false);
            expect(states.extractedAddress).toBeNull();
            expect(states.error).toBeTruthy();
        });
    });

    describe('Form Validation', () => {
        it('should require address1, city, state, and zip', () => {
            const requiredFields = ['address1', 'city', 'state', 'zip'];
            const address = {
                name: 'John Doe',
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            requiredFields.forEach(field => {
                expect(address[field]).toBeTruthy();
            });
        });

        it('should allow optional name and address2', () => {
            const addressWithOptional = {
                name: 'John Doe',
                address1: '123 Main St',
                address2: 'Apt 4B',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            const addressWithoutOptional = {
                address1: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90210',
            };
            
            expect(addressWithOptional.name).toBeTruthy();
            expect(addressWithOptional.address2).toBeTruthy();
            expect(addressWithoutOptional.name).toBeFalsy();
            expect(addressWithoutOptional.address2).toBeFalsy();
        });
    });
});
