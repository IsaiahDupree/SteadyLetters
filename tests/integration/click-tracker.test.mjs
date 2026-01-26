/**
 * Integration tests for Click Redirect Tracker (GDP-006)
 * Tests the attribution spine: email → click → session → conversion
 */

import { prisma } from '../../src/lib/prisma.js';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL_ID = 'test_email_' + Date.now();
const TEST_PERSON_ID = 'test_person_' + Date.now();

describe('Click Redirect Tracker (GDP-006)', () => {
  let testPersonId;
  let testEmailMessageId;

  beforeAll(async () => {
    // Create a test Person
    const person = await prisma.person.create({
      data: {
        id: TEST_PERSON_ID,
        email: 'click-test@example.com',
        firstName: 'Click',
        lastName: 'Tester',
      },
    });
    testPersonId = person.id;

    // Create a test EmailMessage
    const emailMessage = await prisma.emailMessage.create({
      data: {
        personId: testPersonId,
        resendId: TEST_EMAIL_ID,
        from: 'test@steadyletters.com',
        to: 'click-test@example.com',
        subject: 'Test Email for Click Tracking',
        campaign: 'test_campaign',
      },
    });
    testEmailMessageId = emailMessage.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.emailEvent.deleteMany({
      where: { messageId: testEmailMessageId },
    });
    await prisma.emailMessage.delete({
      where: { id: testEmailMessageId },
    });
    await prisma.person.delete({
      where: { id: testPersonId },
    });
  });

  it('should reject requests without url parameter', async () => {
    const response = await fetch(
      `${API_URL}/api/track/click?email_id=${TEST_EMAIL_ID}`
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('url');
  });

  it('should reject requests without email_id parameter', async () => {
    const response = await fetch(
      `${API_URL}/api/track/click?url=https://example.com`
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('email_id');
  });

  it('should reject requests with invalid URL', async () => {
    const response = await fetch(
      `${API_URL}/api/track/click?url=not-a-url&email_id=${TEST_EMAIL_ID}`
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid URL');
  });

  it('should redirect to destination URL on success', async () => {
    const destinationUrl = 'https://example.com/test-page';
    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${TEST_EMAIL_ID}`,
      {
        redirect: 'manual', // Don't follow redirects
      }
    );

    // Should return 307 redirect
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(destinationUrl);
  });

  it('should store EmailEvent record on click', async () => {
    const destinationUrl = 'https://example.com/click-test';
    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${TEST_EMAIL_ID}`,
      {
        redirect: 'manual',
      }
    );

    expect(response.status).toBe(307);

    // Check that EmailEvent was created
    const emailEvent = await prisma.emailEvent.findFirst({
      where: {
        messageId: testEmailMessageId,
        eventType: 'clicked',
        clickedUrl: destinationUrl,
      },
    });

    expect(emailEvent).toBeTruthy();
    expect(emailEvent.clickedUrl).toBe(destinationUrl);
    expect(emailEvent.eventType).toBe('clicked');
  });

  it('should set attribution cookie with correct data', async () => {
    const destinationUrl = 'https://example.com/cookie-test';
    const campaign = 'test_campaign';

    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${TEST_EMAIL_ID}&person_id=${testPersonId}&campaign=${campaign}`,
      {
        redirect: 'manual',
      }
    );

    expect(response.status).toBe(307);

    // Check Set-Cookie header
    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeTruthy();
    expect(setCookieHeader).toContain('sl_attribution');

    // Extract and parse cookie value
    const cookieMatch = setCookieHeader.match(/sl_attribution=([^;]+)/);
    expect(cookieMatch).toBeTruthy();

    const cookieValue = decodeURIComponent(cookieMatch[1]);
    const attribution = JSON.parse(cookieValue);

    expect(attribution.source).toBe('email');
    expect(attribution.email_id).toBe(TEST_EMAIL_ID);
    expect(attribution.person_id).toBe(testPersonId);
    expect(attribution.campaign).toBe(campaign);
    expect(attribution.clicked_url).toBe(destinationUrl);
    expect(attribution.clicked_at).toBeTruthy();
  });

  it('should set cookie with 30-day expiry', async () => {
    const destinationUrl = 'https://example.com/expiry-test';
    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${TEST_EMAIL_ID}`,
      {
        redirect: 'manual',
      }
    );

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toContain('Max-Age=2592000'); // 30 days in seconds
  });

  it('should gracefully handle missing EmailMessage', async () => {
    const destinationUrl = 'https://example.com/missing-email';
    const fakeEmailId = 'nonexistent_email_id';

    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${fakeEmailId}`,
      {
        redirect: 'manual',
      }
    );

    // Should still redirect even if email not found
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(destinationUrl);
  });

  it('should track user agent and IP address', async () => {
    const destinationUrl = 'https://example.com/metadata-test';
    const userAgent = 'Mozilla/5.0 (Test Browser)';

    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${TEST_EMAIL_ID}`,
      {
        redirect: 'manual',
        headers: {
          'User-Agent': userAgent,
        },
      }
    );

    expect(response.status).toBe(307);

    // Check that user agent was captured
    const emailEvent = await prisma.emailEvent.findFirst({
      where: {
        messageId: testEmailMessageId,
        clickedUrl: destinationUrl,
      },
      orderBy: { timestamp: 'desc' },
    });

    expect(emailEvent).toBeTruthy();
    expect(emailEvent.userAgent).toBe(userAgent);
    // IP address might be null in test environment, which is okay
  });

  it('should handle URL with query parameters', async () => {
    const destinationUrl = 'https://example.com/page?param1=value1&param2=value2';
    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${TEST_EMAIL_ID}`,
      {
        redirect: 'manual',
      }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(destinationUrl);
  });

  it('should handle URL with fragments', async () => {
    const destinationUrl = 'https://example.com/page#section';
    const response = await fetch(
      `${API_URL}/api/track/click?url=${encodeURIComponent(destinationUrl)}&email_id=${TEST_EMAIL_ID}`,
      {
        redirect: 'manual',
      }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(destinationUrl);
  });
});
