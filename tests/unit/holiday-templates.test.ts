import { describe, it, expect } from 'vitest';
import {
    HOLIDAY_TEMPLATES,
    getHolidayTemplate,
    getAvailableOccasions,
} from '@/lib/holiday-templates';

describe('Holiday Templates Library', () => {
    it('should have predefined holiday templates', () => {
        expect(HOLIDAY_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('should have required template fields', () => {
        HOLIDAY_TEMPLATES.forEach((template) => {
            expect(template.name).toBeDefined();
            expect(template.occasion).toBeDefined();
            expect(template.message).toBeDefined();
            expect(template.tone).toBeDefined();
        });
    });

    it('should support common holidays', () => {
        const occasions = getAvailableOccasions();
        expect(occasions).toContain('Christmas');
        expect(occasions).toContain('Birthday');
        expect(occasions).toContain('Thank You');
    });

    it('should retrieve template by occasion', () => {
        const template = getHolidayTemplate('Christmas');
        expect(template).toBeDefined();
        expect(template?.occasion).toBe('Christmas');
    });

    it('should return undefined for non-existent occasion', () => {
        const template = getHolidayTemplate('NonExistentOccasion');
        expect(template).toBeUndefined();
    });

    it('should be case-insensitive when searching by occasion', () => {
        const template1 = getHolidayTemplate('christmas');
        const template2 = getHolidayTemplate('CHRISTMAS');
        const template3 = getHolidayTemplate('Christmas');

        expect(template1).toBeDefined();
        expect(template2).toBeDefined();
        expect(template3).toBeDefined();
        expect(template1?.occasion).toBe(template3?.occasion);
    });

    it('should have messages with template variables', () => {
        HOLIDAY_TEMPLATES.forEach((template) => {
            // Check that messages contain at least one template variable like {{name}}
            expect(template.message).toMatch(/\{\{[^}]+\}\}/);
        });
    });

    it('should have at least 10 templates', () => {
        expect(HOLIDAY_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    });

    it('getAvailableOccasions should return all occasions', () => {
        const occasions = getAvailableOccasions();
        expect(occasions.length).toBe(HOLIDAY_TEMPLATES.length);

        // Verify no duplicates
        const uniqueOccasions = new Set(occasions);
        expect(uniqueOccasions.size).toBe(occasions.length);
    });
});
