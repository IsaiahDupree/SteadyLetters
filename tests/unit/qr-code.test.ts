import { describe, it, expect, vi } from 'vitest';
import {
  isValidQRCodeUrl,
  createTrackingUrl,
  generateTrackingId,
  QR_CODE_TEMPLATES,
} from '@/lib/qr-code';

describe('QR Code Utilities', () => {
  describe('isValidQRCodeUrl', () => {
    it('should validate proper URLs', () => {
      expect(isValidQRCodeUrl('https://example.com')).toBe(true);
      expect(isValidQRCodeUrl('http://example.com')).toBe(true);
      expect(isValidQRCodeUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidQRCodeUrl('not a url')).toBe(false);
      expect(isValidQRCodeUrl('example')).toBe(false);
      expect(isValidQRCodeUrl('')).toBe(false);
    });

    it('should handle URLs with ports', () => {
      expect(isValidQRCodeUrl('https://example.com:8080')).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(isValidQRCodeUrl('https://example.com#section')).toBe(true);
    });
  });

  describe('createTrackingUrl', () => {
    it('should create a valid tracking URL', () => {
      const url = createTrackingUrl('https://example.com', 'abc123');
      expect(url).toBe('https://example.com/qr/abc123');
    });

    it('should handle trailing slashes', () => {
      const url = createTrackingUrl('https://example.com/', 'def456');
      expect(url).toContain('/qr/def456');
    });

    it('should work with different base URLs', () => {
      const url = createTrackingUrl('http://localhost:3000', 'xyz789');
      expect(url).toContain('/qr/xyz789');
    });
  });

  describe('generateTrackingId', () => {
    it('should generate a tracking ID', () => {
      const id = generateTrackingId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique tracking IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        ids.add(generateTrackingId());
      }
      expect(ids.size).toBe(10);
    });

    it('should generate alphanumeric tracking IDs', () => {
      const id = generateTrackingId();
      expect(/^[a-z0-9]+$/).toBeTruthy();
    });
  });

  describe('QR_CODE_TEMPLATES', () => {
    it('should have website template', () => {
      const template = QR_CODE_TEMPLATES.website('https://example.com');
      expect(template.data).toBe('https://example.com');
      expect(template.label).toBe('Website');
    });

    it('should have email template', () => {
      const template = QR_CODE_TEMPLATES.email('test@example.com');
      expect(template.data).toContain('mailto:');
      expect(template.label).toBe('Email');
    });

    it('should have phone template', () => {
      const template = QR_CODE_TEMPLATES.phone('+1234567890');
      expect(template.data).toContain('tel:');
      expect(template.label).toBe('Phone');
    });

    it('should have SMS template', () => {
      const template = QR_CODE_TEMPLATES.sms('+1234567890');
      expect(template.data).toContain('smsto:');
      expect(template.label).toBe('SMS');
    });

    it('should have SMS template with message', () => {
      const template = QR_CODE_TEMPLATES.sms('+1234567890', 'Hello World');
      expect(template.data).toContain('smsto:');
      expect(template.data).toContain('Hello%20World');
    });

    it('should have text template', () => {
      const template = QR_CODE_TEMPLATES.text('Hello');
      expect(template.data).toBe('Hello');
      expect(template.label).toBe('Text');
    });
  });

  describe('QR Code Use Cases', () => {
    it('should support business card with contact info', () => {
      const businessCard = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const emailTemplate = QR_CODE_TEMPLATES.email(businessCard.email);
      expect(emailTemplate.data).toContain(businessCard.email);
    });

    it('should support marketing URLs with tracking', () => {
      const marketingUrl = 'https://example.com?ref=letter&id=abc123';
      const template = QR_CODE_TEMPLATES.website(marketingUrl);
      expect(template.data).toContain('ref=letter');
    });

    it('should support customer feedback', () => {
      const feedbackUrl = 'https://example.com/feedback?customer_id=123';
      const template = QR_CODE_TEMPLATES.website(feedbackUrl);
      expect(template.data).toContain('customer_id');
    });

    it('should support social media links', () => {
      const socialUrl = 'https://instagram.com/mybusiness';
      const template = QR_CODE_TEMPLATES.website(socialUrl);
      expect(template.data).toContain('instagram.com');
    });
  });
});
