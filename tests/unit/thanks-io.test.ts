import { describe, test, expect, beforeAll } from '@jest/globals';
import {
    sendPostcard,
    sendLetter,
    sendGreetingCard,
    sendWindowlessLetter,
    getHandwritingStyles,
    getProductsForTier,
    getPostcardPrice,
    PRODUCT_CATALOG,
} from '../src/lib/thanks-io';

describe('Thanks.io Library', () => {
    describe('Product Catalog', () => {
        test('should have all 5 product types', () => {
            const productTypes = Object.keys(PRODUCT_CATALOG);
            expect(productTypes).toHaveLength(5);
            expect(productTypes).toContain('postcard');
            expect(productTypes).toContain('letter');
            expect(productTypes).toContain('greeting');
            expect(productTypes).toContain('windowless_letter');
            expect(productTypes).toContain('giftcard');
        });

        test('should have correct pricing for each product', () => {
            expect(PRODUCT_CATALOG.postcard.basePrice).toBe(1.14);
            expect(PRODUCT_CATALOG.letter.basePrice).toBe(1.20);
            expect(PRODUCT_CATALOG.greeting.basePrice).toBe(3.00);
            expect(PRODUCT_CATALOG.windowless_letter.basePrice).toBe(2.52);
            expect(PRODUCT_CATALOG.giftcard.basePrice).toBe(3.00);
        });

        test('should have correct tier restrictions', () => {
            // Free tier should only have postcards
            expect(PRODUCT_CATALOG.postcard.allowedTiers).toContain('free');

            // Pro should not have giftcard or windowless
            expect(PRODUCT_CATALOG.letter.allowedTiers).toContain('pro');
            expect(PRODUCT_CATALOG.greeting.allowedTiers).toContain('pro');

            // Business should have everything
            expect(PRODUCT_CATALOG.windowless_letter.allowedTiers).toContain('business');
            expect(PRODUCT_CATALOG.giftcard.allowedTiers).toContain('business');
        });
    });

    describe('Postcard Pricing', () => {
        test('should return correct price for 4x6', () => {
            expect(getPostcardPrice('4x6')).toBe(1.14);
        });

        test('should return correct price for 6x9', () => {
            expect(getPostcardPrice('6x9')).toBe(1.61);
        });

        test('should return correct price for 6x11', () => {
            expect(getPostcardPrice('6x11')).toBe(1.83);
        });
    });

    describe('Tier-based Product Access', () => {
        test('free tier should only get postcards', () => {
            const products = getProductsForTier('free');
            expect(products).toHaveLength(1);
            expect(products[0].id).toBe('postcard');
        });

        test('pro tier should get postcards, letters, and greeting cards', () => {
            const products = getProductsForTier('pro');
            expect(products.length).toBeGreaterThanOrEqual(3);

            const productIds = products.map(p => p.id);
            expect(productIds).toContain('postcard');
            expect(productIds).toContain('letter');
            expect(productIds).toContain('greeting');
            expect(productIds).not.toContain('windowless_letter');
            expect(productIds).not.toContain('giftcard');
        });

        test('business tier should get all products', () => {
            const products = getProductsForTier('business');
            expect(products).toHaveLength(5);

            const productIds = products.map(p => p.id);
            expect(productIds).toContain('postcard');
            expect(productIds).toContain('letter');
            expect(productIds).toContain('greeting');
            expect(productIds).toContain('windowless_letter');
            expect(productIds).toContain('giftcard');
        });
    });

    describe('Handwriting Styles', () => {
        test('should return mock styles when API key missing', async () => {
            const styles = await getHandwritingStyles();

            expect(styles.length).toBeGreaterThanOrEqual(6);
            expect(styles[0]).toHaveProperty('id');
            expect(styles[0]).toHaveProperty('name');
            expect(styles[0]).toHaveProperty('style');
        });

        test('should have Jeremy style', async () => {
            const styles = await getHandwritingStyles();
            const jeremy = styles.find(s => s.name === 'Jeremy');

            expect(jeremy).toBeDefined();
            expect(jeremy?.style).toContain('Casual');
        });

        test('should have all 6 standard styles', async () => {
            const styles = await getHandwritingStyles();
            const expectedStyles = ['Jeremy', 'Tribeca', 'Terry', 'Madeline', 'Brooklyn', 'Signature'];

            expectedStyles.forEach(name => {
                const style = styles.find(s => s.name === name);
                expect(style).toBeDefined();
            });
        });
    });

    describe('Postcard Sending', () => {
        test('should return mock order when API key missing', async () => {
            const result = await sendPostcard({
                recipients: [{
                    name: 'Test User',
                    address: '123 Test St',
                    city: 'Test City',
                    province: 'CA',
                    postal_code: '90210',
                    country: 'US',
                }],
                message: 'Test message',
                size: '4x6',
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('status');
            expect(result.status).toBe('queued');
        });

        test('should accept all postcard sizes', async () => {
            const sizes = ['4x6', '6x9', '6x11'] as const;

            for (const size of sizes) {
                const result = await sendPostcard({
                    recipients: [{
                        name: 'Test User',
                        address: '123 Test St',
                        city: 'Test City',
                        province: 'CA',
                        postal_code: '90210',
                    }],
                    message: 'Test',
                    size,
                });

                expect(result.id).toContain('postcard');
            }
        });
    });

    describe('Letter Sending', () => {
        test('should return mock order for letters', async () => {
            const result = await sendLetter({
                recipients: [{
                    name: 'Test User',
                    address: '123 Test St',
                    city: 'Test City',
                    province: 'CA',
                    postal_code: '90210',
                }],
                message: 'Test letter message',
            });

            expect(result).toHaveProperty('id');
            expect(result.id).toContain('letter');
            expect(result.status).toBe('queued');
        });
    });

    describe('Greeting Card Sending', () => {
        test('should return mock order for greeting cards', async () => {
            const result = await sendGreetingCard({
                recipients: [{
                    name: 'Test User',
                    address: '123 Test St',
                    city: 'Test City',
                    province: 'CA',
                    postal_code: '90210',
                }],
                message: 'Test greeting',
            });

            expect(result).toHaveProperty('id');
            expect(result.id).toContain('greeting');
            expect(result.status).toBe('queued');
        });
    });

    describe('Windowless Letter Sending', () => {
        test('should return mock order for windowless letters', async () => {
            const result = await sendWindowlessLetter({
                recipients: [{
                    name: 'Test User',
                    address: '123 Test St',
                    city: 'Test City',
                    province: 'CA',
                    postal_code: '90210',
                }],
                pdf_url: 'https://example.com/test.pdf',
            });

            expect(result).toHaveProperty('id');
            expect(result.id).toContain('windowless');
            expect(result.status).toBe('queued');
        });
    });

    describe('Product Info Validation', () => {
        test('all products should have required fields', () => {
            Object.values(PRODUCT_CATALOG).forEach(product => {
                expect(product).toHaveProperty('id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('description');
                expect(product).toHaveProperty('basePrice');
                expect(product).toHaveProperty('features');
                expect(product).toHaveProperty('allowedTiers');

                expect(Array.isArray(product.features)).toBe(true);
                expect(Array.isArray(product.allowedTiers)).toBe(true);
                expect(product.basePrice).toBeGreaterThan(0);
            });
        });

        test('product features should be descriptive', () => {
            Object.values(PRODUCT_CATALOG).forEach(product => {
                expect(product.features.length).toBeGreaterThan(0);
                product.features.forEach(feature => {
                    expect(typeof feature).toBe('string');
                    expect(feature.length).toBeGreaterThan(0);
                });
            });
        });
    });
});

// Run the tests
if (require.main === module) {
    console.log('Running Thanks.io Library Tests...');
}
