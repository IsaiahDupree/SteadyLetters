/**
 * Unit tests for email link wrapping utilities (GDP-006)
 */

import { wrapLinkWithTracking, wrapLinksInHtml } from '../../src/lib/email.js';

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://www.steadyletters.com';

describe('Email Link Wrapping (GDP-006)', () => {
  describe('wrapLinkWithTracking', () => {
    it('should wrap a simple URL', () => {
      const url = 'https://example.com';
      const emailId = 'test_email_123';
      const personId = 'person_456';
      const campaign = 'test_campaign';

      const wrapped = wrapLinkWithTracking(url, emailId, personId, campaign);

      expect(wrapped).toContain('/api/track/click');
      expect(wrapped).toContain(`url=${encodeURIComponent(url)}`);
      expect(wrapped).toContain(`email_id=${emailId}`);
      expect(wrapped).toContain(`person_id=${personId}`);
      expect(wrapped).toContain(`campaign=${campaign}`);
    });

    it('should work without optional parameters', () => {
      const url = 'https://example.com';
      const emailId = 'test_email_123';

      const wrapped = wrapLinkWithTracking(url, emailId);

      expect(wrapped).toContain('/api/track/click');
      expect(wrapped).toContain(`url=${encodeURIComponent(url)}`);
      expect(wrapped).toContain(`email_id=${emailId}`);
      expect(wrapped).not.toContain('person_id');
      expect(wrapped).not.toContain('campaign');
    });

    it('should preserve URL with query parameters', () => {
      const url = 'https://example.com/page?param=value&foo=bar';
      const emailId = 'test_email_123';

      const wrapped = wrapLinkWithTracking(url, emailId);

      expect(wrapped).toContain(encodeURIComponent(url));
    });

    it('should preserve URL with fragments', () => {
      const url = 'https://example.com/page#section';
      const emailId = 'test_email_123';

      const wrapped = wrapLinkWithTracking(url, emailId);

      expect(wrapped).toContain(encodeURIComponent(url));
    });
  });

  describe('wrapLinksInHtml', () => {
    it('should wrap a single link', () => {
      const html = '<p>Click <a href="https://example.com">here</a>!</p>';
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      expect(wrapped).toContain('/api/track/click');
      expect(wrapped).toContain('email_id=test_email_123');
      expect(wrapped).toContain('Click <a href=');
      expect(wrapped).toContain('>here</a>');
    });

    it('should wrap multiple links', () => {
      const html = `
        <div>
          <a href="https://example.com/page1">Link 1</a>
          <a href="https://example.com/page2">Link 2</a>
        </div>
      `;
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      // Should wrap both links
      const trackingLinkMatches = wrapped.match(/\/api\/track\/click/g);
      expect(trackingLinkMatches).toHaveLength(2);
    });

    it('should preserve link attributes', () => {
      const html = '<a href="https://example.com" class="button" target="_blank" rel="noopener">Click</a>';
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      expect(wrapped).toContain('class="button"');
      expect(wrapped).toContain('target="_blank"');
      expect(wrapped).toContain('rel="noopener"');
    });

    it('should NOT wrap mailto links', () => {
      const html = '<a href="mailto:test@example.com">Email us</a>';
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      expect(wrapped).toBe(html); // Should be unchanged
      expect(wrapped).not.toContain('/api/track/click');
    });

    it('should NOT wrap tel links', () => {
      const html = '<a href="tel:+1234567890">Call us</a>';
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      expect(wrapped).toBe(html); // Should be unchanged
      expect(wrapped).not.toContain('/api/track/click');
    });

    it('should NOT wrap anchor links', () => {
      const html = '<a href="#section">Jump to section</a>';
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      expect(wrapped).toBe(html); // Should be unchanged
      expect(wrapped).not.toContain('/api/track/click');
    });

    it('should NOT double-wrap already tracked links', () => {
      const trackedUrl = `${DOMAIN}/api/track/click?url=https://example.com&email_id=old_id`;
      const html = `<a href="${trackedUrl}">Already tracked</a>`;
      const emailId = 'new_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      expect(wrapped).toBe(html); // Should be unchanged
      // Count tracking URLs - should only be 1
      const trackingLinkMatches = wrapped.match(/\/api\/track\/click/g);
      expect(trackingLinkMatches).toHaveLength(1);
    });

    it('should handle links with single quotes', () => {
      const html = "<a href='https://example.com'>Link</a>";
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      expect(wrapped).toContain('/api/track/click');
      expect(wrapped).toContain('email_id=test_email_123');
    });

    it('should handle mixed quote styles', () => {
      const html = `
        <a href="https://example.com/page1">Double quotes</a>
        <a href='https://example.com/page2'>Single quotes</a>
      `;
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      const trackingLinkMatches = wrapped.match(/\/api\/track\/click/g);
      expect(trackingLinkMatches).toHaveLength(2);
    });

    it('should include person_id and campaign when provided', () => {
      const html = '<a href="https://example.com">Link</a>';
      const emailId = 'test_email_123';
      const personId = 'person_456';
      const campaign = 'test_campaign';

      const wrapped = wrapLinksInHtml(html, emailId, personId, campaign);

      expect(wrapped).toContain('email_id=test_email_123');
      expect(wrapped).toContain('person_id=person_456');
      expect(wrapped).toContain('campaign=test_campaign');
    });

    it('should handle complex HTML with multiple elements', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Welcome</h1>
            <p>Visit our <a href="https://example.com/website">website</a> or <a href="mailto:info@example.com">email us</a>.</p>
            <footer>
              <a href="https://example.com/privacy">Privacy</a> |
              <a href="https://example.com/terms">Terms</a>
            </footer>
          </body>
        </html>
      `;
      const emailId = 'test_email_123';

      const wrapped = wrapLinksInHtml(html, emailId);

      // Should wrap 3 links (website, privacy, terms) but NOT the mailto link
      const trackingLinkMatches = wrapped.match(/\/api\/track\/click/g);
      expect(trackingLinkMatches).toHaveLength(3);

      // Mailto link should be unchanged
      expect(wrapped).toContain('href="mailto:info@example.com"');
    });
  });
});
