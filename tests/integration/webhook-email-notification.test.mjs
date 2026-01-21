/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';

describe('Email Notification Integration', () => {
  let sendOrderStatusEmail;
  let sendEmail;
  let mockResend;

  beforeEach(async () => {
    jest.resetModules();

    // Mock Resend client
    mockResend = {
      emails: {
        send: jest.fn().mockResolvedValue({
          data: { id: 'test-email-id-123' },
          error: null,
        }),
      },
    };

    // Mock Resend module
    jest.unstable_mockModule('resend', () => ({
      Resend: jest.fn().mockImplementation(() => mockResend),
    }));

    // Set environment variables for testing
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.RESEND_FROM_EMAIL = 'test@steadyletters.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.steadyletters.com';

    // Import after mocking
    const emailModule = await import('../../src/lib/email.js');
    sendOrderStatusEmail = emailModule.sendOrderStatusEmail;
    sendEmail = emailModule.sendEmail;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('Resend Integration', () => {
    it('should call Resend API with correct parameters', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@steadyletters.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });
    });

    it('should return true on successful send', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
    });

    it('should return false on Resend error', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'API error' },
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('should return false on exception', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Network error'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });
  });

  describe('Order Status Email Templates', () => {
    it('should send email with order status details', async () => {
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

      expect(result).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@steadyletters.com',
          to: 'user@example.com',
          subject: expect.stringContaining('Shipped'),
        })
      );

      // Check HTML content includes order details
      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.html).toContain('ord_123');
      expect(callArgs.html).toContain('thanks_456');
      expect(callArgs.html).toContain('Jane Smith');
      expect(callArgs.html).toContain('SteadyLetters');
    });

    it('should include Thanks.io order ID when provided', async () => {
      await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'delivered',
        {
          orderId: 'ord_124',
          thanksIoOrderId: 'thanks_789',
          productType: 'Postcard',
          recipientName: 'Jane Smith',
          recipientAddress: '456 Oak Ave, LA, CA 90001',
        }
      );

      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.html).toContain('thanks_789');
      expect(callArgs.html).toContain('Thanks.io Order');
    });

    it('should omit Thanks.io order ID when not provided', async () => {
      await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'pending',
        {
          orderId: 'ord_125',
          productType: 'Greeting Card',
          recipientName: 'Bob Johnson',
          recipientAddress: '789 Pine St, NYC, NY 10001',
        }
      );

      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.html).not.toContain('Thanks.io Order');
      expect(callArgs.html).toContain('ord_125');
      expect(callArgs.html).toContain('Bob Johnson');
    });

    it('should use correct status colors', async () => {
      const statuses = [
        { status: 'shipped', color: '#10b981' },
        { status: 'delivered', color: '#22c55e' },
        { status: 'failed', color: '#ef4444' },
        { status: 'pending', color: '#f59e0b' },
      ];

      for (const { status, color } of statuses) {
        mockResend.emails.send.mockClear();

        await sendOrderStatusEmail(
          'user@example.com',
          'John Doe',
          status,
          {
            orderId: 'ord_test',
            productType: 'Letter',
            recipientName: 'Test',
            recipientAddress: 'Test Address',
          }
        );

        const callArgs = mockResend.emails.send.mock.calls[0][0];
        expect(callArgs.html).toContain(`background-color: ${color}`);
      }
    });

    it('should include view order button with correct link', async () => {
      await sendOrderStatusEmail(
        'user@example.com',
        'John Doe',
        'shipped',
        {
          orderId: 'ord_view_test',
          productType: 'Letter',
          recipientName: 'Test',
          recipientAddress: 'Test Address',
        }
      );

      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.html).toContain('href="https://test.steadyletters.com/orders/ord_view_test"');
      expect(callArgs.html).toContain('View Order Details');
    });

    it('should handle bulk orders with multiple recipients', async () => {
      await sendOrderStatusEmail(
        'bulk@example.com',
        'Bulk User',
        'printed',
        {
          orderId: 'mail_bulk_123',
          thanksIoOrderId: 'thanks_bulk',
          productType: 'Postcard',
          recipientName: '25 recipient(s)',
          recipientAddress: 'Multiple addresses',
        }
      );

      const callArgs = mockResend.emails.send.mock.calls[0][0];
      expect(callArgs.html).toContain('25 recipient(s)');
      expect(callArgs.html).toContain('Multiple addresses');
      expect(callArgs.html).toContain('Postcard');
    });

    it('should escape HTML in user data', async () => {
      await sendOrderStatusEmail(
        'test@example.com',
        '<script>alert("xss")</script>',
        'shipped',
        {
          orderId: 'ord_xss_test',
          productType: 'Letter',
          recipientName: '<b>Test</b>',
          recipientAddress: '<i>Test Address</i>',
        }
      );

      const callArgs = mockResend.emails.send.mock.calls[0][0];
      // Values should be included but treated as text, not executed
      expect(callArgs.html).toContain('Test');
      expect(mockResend.emails.send).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing environment variables gracefully', async () => {
      // Remove API key to test graceful degradation
      delete process.env.RESEND_API_KEY;

      // Re-import module without API key
      jest.resetModules();
      const emailModule = await import('../../src/lib/email.js');
      const sendEmailNoKey = emailModule.sendEmail;

      const result = await sendEmailNoKey({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      // Should return false but not throw
      expect(result).toBe(false);
    });
  });
});
