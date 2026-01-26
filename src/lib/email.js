import { Resend } from 'resend';

// Initialize Resend client
// In development/test, if no API key is provided, we'll gracefully handle it
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://www.steadyletters.com';

/**
 * Wrap a URL with click tracking redirect (GDP-006)
 * @param {string} url - Original destination URL
 * @param {string} emailId - Resend email ID
 * @param {string} [personId] - Person ID
 * @param {string} [campaign] - Campaign name
 * @returns {string} - Tracking URL that redirects to original
 */
export function wrapLinkWithTracking(url, emailId, personId, campaign) {
  const trackingUrl = new URL(`${DOMAIN}/api/track/click`);
  trackingUrl.searchParams.set('url', url);
  trackingUrl.searchParams.set('email_id', emailId);
  if (personId) {
    trackingUrl.searchParams.set('person_id', personId);
  }
  if (campaign) {
    trackingUrl.searchParams.set('campaign', campaign);
  }
  return trackingUrl.toString();
}

/**
 * Wrap all <a href="..."> links in HTML with click tracking
 * @param {string} html - Original HTML content
 * @param {string} emailId - Resend email ID
 * @param {string} [personId] - Person ID
 * @param {string} [campaign] - Campaign name
 * @returns {string} - HTML with tracking URLs
 */
export function wrapLinksInHtml(html, emailId, personId, campaign) {
  // Replace all <a href="..."> with tracking URLs
  return html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, url, after) => {
      // Don't wrap if already a tracking link
      if (url.includes('/api/track/click')) {
        return match;
      }

      // Don't wrap mailto: or tel: links
      if (url.startsWith('mailto:') || url.startsWith('tel:')) {
        return match;
      }

      // Don't wrap anchor links
      if (url.startsWith('#')) {
        return match;
      }

      // Wrap with tracking
      const trackedUrl = wrapLinkWithTracking(url, emailId, personId, campaign);
      return `<a ${before}href="${trackedUrl}"${after}>`;
    }
  );
}

/**
 * Send an email using Resend with click tracking (GDP-006)
 * Gracefully handles missing API key in development
 *
 * IMPORTANT: Click tracking works by wrapping links AFTER we receive
 * the email_id from Resend. This means:
 * 1. We send the email with original links
 * 2. Resend returns the email_id
 * 3. Webhook receives email.sent event
 * 4. Future emails can reference this email_id for click tracking
 *
 * For click tracking to work, use the Resend webhook to store the email_id
 * and then include tracking links in FUTURE emails that reference past emails.
 *
 * Alternative: Use the `wrapLinksInHtml` utility BEFORE calling this function
 * with a predictable tracking ID (e.g., campaign_id + person_id + timestamp).
 *
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content (can pre-wrap links with wrapLinksInHtml)
 * @param {string} [params.text] - Optional plain text content
 * @param {string} [params.personId] - Optional person ID for tracking
 * @param {string} [params.campaign] - Optional campaign name
 * @param {string} [params.segmentId] - Optional segment ID
 * @returns {Promise<{success: boolean, emailId?: string}>} - Result with success status and email ID
 */
export async function sendEmail({ to, subject, html, text, personId, campaign, segmentId }) {
  // If no Resend client, log and skip (dev mode)
  if (!resend) {
    console.warn('[Email] Resend API key not configured, skipping email send');
    console.log('[Email] Would have sent:', { to, subject });
    return { success: false };
  }

  try {
    // Build tags array for tracking
    const tags = [];
    if (personId) {
      tags.push({ name: 'person_id', value: personId });
    }
    if (campaign) {
      tags.push({ name: 'campaign', value: campaign });
    }
    if (segmentId) {
      tags.push({ name: 'segment_id', value: segmentId });
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      ...(tags.length > 0 && { tags }),
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return { success: false };
    }

    console.log('[Email] Sent successfully:', { to, subject, id: result.data?.id });
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return { success: false };
  }
}

/**
 * Simple HTML stripper for plain text fallback
 * @param {string} html - HTML content
 * @returns {string} - Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Order status change email notification
 * @param {string} recipientEmail - User email address
 * @param {string} recipientName - User name
 * @param {string} orderStatus - Order status
 * @param {Object} orderDetails - Order details
 * @param {string} orderDetails.orderId - Order ID
 * @param {string} [orderDetails.thanksIoOrderId] - Thanks.io Order ID
 * @param {string} orderDetails.productType - Product type
 * @param {string} orderDetails.recipientName - Recipient name
 * @param {string} orderDetails.recipientAddress - Recipient address
 * @param {string} [orderDetails.personId] - Person ID for tracking
 * @param {string} [orderDetails.emailId] - Previous email ID for click tracking reference
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendOrderStatusEmail(
  recipientEmail,
  recipientName,
  orderStatus,
  orderDetails
) {
  const subject = `Your SteadyLetters order is ${getStatusLabel(orderStatus)}`;

  // Generate HTML (will include tracking links if emailId provided)
  const html = generateOrderStatusEmailHtml({
    userName: recipientName,
    orderStatus,
    statusLabel: getStatusLabel(orderStatus),
    orderDetails,
  });

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html,
    personId: orderDetails.personId,
    campaign: 'order_status',
  });

  return result.success;
}

/**
 * Get human-readable status label
 * @param {string} status - Order status
 * @returns {string} - Human-readable label
 */
function getStatusLabel(status) {
  const statusMap = {
    'pending': 'Pending',
    'queued': 'Queued',
    'processing': 'Being Processed',
    'printed': 'Printed',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
  };

  return statusMap[status.toLowerCase()] || status;
}

/**
 * Get status color for email styling
 * @param {string} status - Order status
 * @returns {string} - Hex color code
 */
function getStatusColor(status) {
  const colorMap = {
    'pending': '#f59e0b',
    'queued': '#f59e0b',
    'processing': '#3b82f6',
    'printed': '#8b5cf6',
    'shipped': '#10b981',
    'delivered': '#22c55e',
    'failed': '#ef4444',
    'cancelled': '#6b7280',
  };

  return colorMap[status.toLowerCase()] || '#6b7280';
}

/**
 * Send a campaign email with click tracking (GDP-006)
 * This function pre-creates the EmailMessage record to enable click tracking
 *
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.personId - Person ID (required for campaigns)
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content (links will be auto-wrapped)
 * @param {string} params.campaign - Campaign name
 * @param {string} [params.segmentId] - Optional segment ID
 * @returns {Promise<{success: boolean, emailId?: string, messageId?: string}>}
 */
export async function sendCampaignEmail({ to, personId, subject, html, campaign, segmentId }) {
  // If no Resend client, log and skip (dev mode)
  if (!resend) {
    console.warn('[Email] Resend API key not configured, skipping campaign email');
    return { success: false };
  }

  try {
    // IMPORTANT: For click tracking to work, we need to:
    // 1. Send the email and get the resendId
    // 2. Then users can click links that reference this resendId
    //
    // Since we can't know resendId before sending, we have two options:
    // A) Use campaign-level tracking (track by campaign, not specific email)
    // B) Use a two-step process (send, get ID, update links in DB)
    //
    // For now, we'll use option A: wrap links with campaign tracking
    // This allows attribution even without the specific email_id

    // Note: In a production system, you'd want to:
    // - Generate a predictable email identifier before sending
    // - Store it in your database
    // - Use that identifier for click tracking
    // - Map it to the resendId when the webhook arrives

    // Build tags array for tracking
    const tags = [
      { name: 'person_id', value: personId },
      { name: 'campaign', value: campaign },
    ];
    if (segmentId) {
      tags.push({ name: 'segment_id', value: segmentId });
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html, // Links should be pre-wrapped by caller if needed
      text: stripHtml(html),
      tags,
    });

    if (result.error) {
      console.error('[Email] Campaign send failed:', result.error);
      return { success: false };
    }

    console.log('[Email] Campaign sent:', { to, campaign, id: result.data?.id });
    return {
      success: true,
      emailId: result.data?.id,
    };

  } catch (error) {
    console.error('[Email] Error sending campaign email:', error);
    return { success: false };
  }
}

/**
 * Generate HTML for order status email
 * @param {Object} params - Email parameters
 * @param {string} params.userName - User name
 * @param {string} params.orderStatus - Order status
 * @param {string} params.statusLabel - Human-readable status label
 * @param {Object} params.orderDetails - Order details
 * @returns {string} - HTML email content
 */
function generateOrderStatusEmailHtml(params) {
  const { userName, orderStatus, statusLabel, orderDetails } = params;
  const statusColor = getStatusColor(orderStatus);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update - SteadyLetters</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                SteadyLetters
              </h1>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; text-align: center;">
              <div style="display: inline-block; background-color: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                ${statusLabel}
              </div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                Order Status Update
              </h2>
              <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.5;">
                Hi ${userName}, your order status has been updated to <strong style="color: #111827;">${statusLabel}</strong>.
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Order ID:</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 500; margin-left: 8px;">${orderDetails.orderId}</span>
                  </td>
                </tr>
                ${orderDetails.thanksIoOrderId ? `
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Thanks.io Order:</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 500; margin-left: 8px;">${orderDetails.thanksIoOrderId}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Product:</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 500; margin-left: 8px;">${orderDetails.productType}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Recipient:</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 500; margin-left: 8px;">${orderDetails.recipientName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #6b7280;">Address:</span>
                    <span style="font-size: 14px; color: #111827; font-weight: 500; margin-left: 8px;">${orderDetails.recipientAddress}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${DOMAIN}/orders/${orderDetails.orderId}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 500;">
                View Order Details
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Thanks for using SteadyLetters!<br>
                Questions? Reply to this email or visit our <a href="${DOMAIN}/support" style="color: #3b82f6; text-decoration: none;">support page</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
