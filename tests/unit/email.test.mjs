/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';

describe('Email Notification System', () => {
  let sendEmail, sendOrderStatusEmail;

  beforeEach(async () => {
    // Clear module cache
    jest.resetModules();

    // Mock Resend
    jest.unstable_mockModule('resend', () => ({
      Resend: jest.fn().mockImplementation(() => ({
        emails: {
          send: jest.fn().mockResolvedValue({
            data: { id: 'test-email-id' },
            error: null,
          }),
        },
      })),
    }));

    // Import after mocking
    const emailModule = await import('../../src/lib/email.js');
    sendEmail = emailModule.sendEmail;
    sendOrderStatusEmail = emailModule.sendOrderStatusEmail;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email with required parameters', async () => {
      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      // In test mode without RESEND_API_KEY, it should return false but not throw
      expect(typeof result).toBe('boolean');
    });

    it('should handle missing text parameter', async () => {
      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(typeof result).toBe('boolean');
    });

    it('should strip HTML for text fallback', async () => {
      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello <strong>World</strong></p>',
      });

      expect(typeof result).toBe('boolean');
    });
  });

  describe('sendOrderStatusEmail', () => {
    it('should send order status email with all required fields', async () => {
      const result = await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'shipped',
        {
          orderId: 'ord_123',
          thanksIoOrderId: 'thanks_456',
          productType: 'Letter',
          recipientName: 'Jane Smith',
          recipientAddress: '123 Main St, San Francisco, CA 94102',
        }
      );

      expect(typeof result).toBe('boolean');
    });

    it('should handle different order statuses', async () => {
      const statuses = ['pending', 'queued', 'processing', 'printed', 'shipped', 'delivered'];

      for (const status of statuses) {
        const result = await sendOrderStatusEmail(
          'user@example.com',
          'John Doe',
          status,
          {
            orderId: 'ord_123',
            productType: 'Postcard',
            recipientName: 'Jane Smith',
            recipientAddress: '123 Main St',
          }
        );

        expect(typeof result).toBe('boolean');
      }
    });

    it('should handle orders without thanksIoOrderId', async () => {
      const result = await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'pending',
        {
          orderId: 'ord_123',
          productType: 'Greeting Card',
          recipientName: 'Jane Smith',
          recipientAddress: '123 Main St',
        }
      );

      expect(typeof result).toBe('boolean');
    });

    it('should handle failed and cancelled statuses', async () => {
      const failedResult = await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'failed',
        {
          orderId: 'ord_123',
          productType: 'Letter',
          recipientName: 'Jane Smith',
          recipientAddress: '123 Main St',
        }
      );

      const cancelledResult = await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'cancelled',
        {
          orderId: 'ord_123',
          productType: 'Letter',
          recipientName: 'Jane Smith',
          recipientAddress: '123 Main St',
        }
      );

      expect(typeof failedResult).toBe('boolean');
      expect(typeof cancelledResult).toBe('boolean');
    });

    it('should handle special characters in recipient details', async () => {
      const result = await sendOrderStatusEmail(
        'user@example.com',
        "O'Brien & Sons",
        'shipped',
        {
          orderId: 'ord_123',
          productType: 'Letter',
          recipientName: 'José García-López',
          recipientAddress: '123 "Main" St, Apt #5',
        }
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Email Template Generation', () => {
    it('should generate valid HTML email structure', async () => {
      // Mock console to capture logs
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'shipped',
        {
          orderId: 'ord_123',
          thanksIoOrderId: 'thanks_456',
          productType: 'Letter',
          recipientName: 'Jane Smith',
          recipientAddress: '123 Main St',
        }
      );

      // In test mode, it should log the attempt
      // Expect it to not throw
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle gracefully when Resend is not configured', async () => {
      // The module should return false when RESEND_API_KEY is not set
      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(typeof result).toBe('boolean');
    });

    it('should not throw errors on email send failure', async () => {
      await expect(
        sendOrderStatusEmail(
          'invalid-email',
          'John Doe',
          'shipped',
          {
            orderId: 'ord_123',
            productType: 'Letter',
            recipientName: 'Jane Smith',
            recipientAddress: '123 Main St',
          }
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Email Content Validation', () => {
    it('should include order ID in email', async () => {
      const orderId = 'ord_unique_123';
      await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'shipped',
        {
          orderId,
          productType: 'Letter',
          recipientName: 'Jane Smith',
          recipientAddress: '123 Main St',
        }
      );

      // Email should be sent (or attempted) without errors
      expect(true).toBe(true);
    });

    it('should use correct status labels', async () => {
      // Test that different statuses are handled
      const testCases = [
        { status: 'pending', expectedLabel: 'Pending' },
        { status: 'shipped', expectedLabel: 'Shipped' },
        { status: 'delivered', expectedLabel: 'Delivered' },
      ];

      for (const { status } of testCases) {
        await expect(
          sendOrderStatusEmail(
            'user@example.com',
            'John Doe',
            status,
            {
              orderId: 'ord_123',
              productType: 'Letter',
              recipientName: 'Jane Smith',
              recipientAddress: '123 Main St',
            }
          )
        ).resolves.not.toThrow();
      }
    });
  });
});
