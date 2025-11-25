import { describe, test, expect } from '@jest/globals';
import {
    sendPostcard,
    sendLetter,
    sendGreetingCard,
    sendWindowlessLetter,
    getHandwritingStyles,
    getProductsForTier,
    getPostcardPrice,
    PRODUCT_CATALOG,
} from '../../src/lib/thanks-io.ts';

describe('Thanks.io Library - Product Catalog', () => {
    test('should have all 5 product types', () => {
        const productTypes = Object.keys(PRODUCT_CATALOG);
        expect(productTypes.length).toBe(5);
        expect(productTypes).toContain('postcard');
        expect(productTypes).toContain('letter');
        expect(productTypes).toContain('greeting');
        expect(productTypes).toContain('windowless_letter');
        expect(productTypes).toContain('giftcard');
    });

    test('postcard should cost $1.14', () => {
        expect(PRODUCT_CATALOG.postcard.basePrice).toBe(1.14);
    });

    test('letter should cost $1.20', () => {
        expect(PRODUCT_CATALOG.letter.basePrice).toBe(1.20);
    });

    test('greeting card should cost $3.00', () => {
        expect(PRODUCT_CATALOG.greeting.basePrice).toBe(3.00);
    });

    test('windowless letter should cost $2.52', () => {
        expect(PRODUCT_CATALOG.windowless_letter.basePrice).toBe(2.52);
    });

    test('gift card should cost $3.00', () => {
        expect(PRODUCT_CATALOG.giftcard.basePrice).toBe(3.00);
    });
});

describe('Thanks.io Library - Postcard Pricing', () => {
    test('4x6 postcard should cost $1.14', () => {
        expect(getPostcardPrice('4x6')).toBe(1.14);
    });

    test('6x9 postcard should cost $1.61', () => {
        expect(getPostcardPrice('6x9')).toBe(1.61);
    });

    test('6x11 postcard should cost $1.83', () => {
        expect(getPostcardPrice('6x11')).toBe(1.83);
    });
});

describe('Thanks.io Library - Tier Restrictions', () => {
    test('free tier should only get postcards', () => {
        const products = getProductsForTier('free');
        expect(products.length).toBe(1);
        expect(products[0].id).toBe('postcard');
    });

    test('pro tier should get 3 products', () => {
        const products = getProductsForTier('pro');
        expect(products.length).toBeGreaterThanOrEqual(3);

        const productIds = products.map(p => p.id);
        expect(productIds).toContain('postcard');
        expect(productIds).toContain('letter');
        expect(productIds).toContain('greeting');
    });

    test('business tier should get all 5 products', () => {
        const products = getProductsForTier('business');
        expect(products.length).toBe(5);
    });

    test('postcard should be available to all tiers', () => {
        expect(PRODUCT_CATALOG.postcard.allowedTiers).toContain('free');
        expect(PRODUCT_CATALOG.postcard.allowedTiers).toContain('pro');
        expect(PRODUCT_CATALOG.postcard.allowedTiers).toContain('business');
    });

    test('windowless letter should only be available to business', () => {
        const tiers = PRODUCT_CATALOG.windowless_letter.allowedTiers;
        expect(tiers).toContain('business');
        expect(tiers).not.toContain('free');
    });

    test('gift card should only be available to business', () => {
        const tiers = PRODUCT_CATALOG.giftcard.allowedTiers;
        expect(tiers).toContain('business');
        expect(tiers).not.toContain('free');
    });
});

describe('Thanks.io Library - Handwriting Styles', () => {
    test('should return mock styles', async () => {
        const styles = await getHandwritingStyles();
        expect(styles.length).toBeGreaterThanOrEqual(6);
    });

    test('styles should have id, name, and style fields', async () => {
        const styles = await getHandwritingStyles();
        expect(styles[0]).toHaveProperty('id');
        expect(styles[0]).toHaveProperty('name');
        expect(styles[0]).toHaveProperty('style');
    });

    test('should include Jeremy style', async () => {
        const styles = await getHandwritingStyles();
        const jeremy = styles.find(s => s.name === 'Jeremy');
        expect(jeremy).toBeDefined();
    });

    test('should include Tribeca style', async () => {
        const styles = await getHandwritingStyles();
        const tribeca = styles.find(s => s.name === 'Tribeca');
        expect(tribeca).toBeDefined();
    });

    test('Jeremy should be casual and friendly', async () => {
        const styles = await getHandwritingStyles();
        const jeremy = styles.find(s => s.name === 'Jeremy');
        expect(jeremy.style).toContain('Casual');
    });
});

describe('Thanks.io Library - Postcard Sending', () => {
    test('should return mock order with id', async () => {
        const result = await sendPostcard({
            recipients: [{
                name: 'Test User',
                address: '123 Test St',
                city: 'Test City',
                province: 'CA',
                postal_code: '90210',
            }],
            message: 'Test message',
        });

        expect(result).toHaveProperty('id');
        expect(result.id).toContain('postcard');
    });

    test('should return queued status', async () => {
        const result = await sendPostcard({
            recipients: [{
                name: 'Test',
                address: '123',
                city: 'City',
                province: 'CA',
                postal_code: '90210',
            }],
            message: 'Test',
        });

        expect(result.status).toBe('queued');
    });

    test('should accept 4x6 size', async () => {
        const result = await sendPostcard({
            recipients: [{ name: 'Test', address: '123', city: 'City', province: 'CA', postal_code: '90210' }],
            message: 'Test',
            size: '4x6',
        });
        expect(result.id).toBeDefined();
    });

    test('should accept 6x9 size', async () => {
        const result = await sendPostcard({
            recipients: [{ name: 'Test', address: '123', city: 'City', province: 'CA', postal_code: '90210' }],
            message: 'Test',
            size: '6x9',
        });
        expect(result.id).toBeDefined();
    });

    test('should accept 6x11 size', async () => {
        const result = await sendPostcard({
            recipients: [{ name: 'Test', address: '123', city: 'City', province: 'CA', postal_code: '90210' }],
            message: 'Test',
            size: '6x11',
        });
        expect(result.id).toBeDefined();
    });
});

describe('Thanks.io Library - Letter Sending', () => {
    test('should send letter and return order', async () => {
        const result = await sendLetter({
            recipients: [{
                name: 'Test',
                address: '123',
                city: 'City',
                province: 'CA',
                postal_code: '90210',
            }],
            message: 'Test letter',
        });

        expect(result).toHaveProperty('id');
        expect(result.id).toContain('letter');
        expect(result.status).toBe('queued');
    });
});

describe('Thanks.io Library - Greeting Card Sending', () => {
    test('should send greeting card and return order', async () => {
        const result = await sendGreetingCard({
            recipients: [{
                name: 'Test',
                address: '123',
                city: 'City',
                province: 'CA',
                postal_code: '90210',
            }],
            message: 'Happy Birthday!',
        });

        expect(result).toHaveProperty('id');
        expect(result.id).toContain('greeting');
    });
});

describe('Thanks.io Library - Windowless Letter Sending', () => {
    test('should send windowless letter with PDF', async () => {
        const result = await sendWindowlessLetter({
            recipients: [{
                name: 'Test',
                address: '123',
                city: 'City',
                province: 'CA',
                postal_code: '90210',
            }],
            pdf_url: 'https://example.com/test.pdf',
        });

        expect(result).toHaveProperty('id');
        expect(result.id).toContain('windowless');
    });
});

describe('Thanks.io Library - Product Features', () => {
    test('all products should have features array', () => {
        Object.values(PRODUCT_CATALOG).forEach(product => {
            expect(Array.isArray(product.features)).toBe(true);
            expect(product.features.length).toBeGreaterThan(0);
        });
    });

    test('all products should have descriptions', () => {
        Object.values(PRODUCT_CATALOG).forEach(product => {
            expect(product.description).toBeDefined();
            expect(product.description.length).toBeGreaterThan(0);
        });
    });

    test('all products should have names', () => {
        Object.values(PRODUCT_CATALOG).forEach(product => {
            expect(product.name).toBeDefined();
            expect(product.name.length).toBeGreaterThan(0);
        });
    });
});
