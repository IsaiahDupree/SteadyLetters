import { PostHog } from 'posthog-node';

// Server-side PostHog client
let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  // Only initialize if API key is available
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    });
  }

  return posthogClient;
}

// Track server-side event
export async function trackServerEvent(
  userId: string | null,
  event: string,
  properties?: Record<string, any>
) {
  const client = getPostHogClient();
  if (!client) {
    // Silently skip if PostHog is not configured
    return;
  }

  try {
    if (userId) {
      client.capture({
        distinctId: userId,
        event,
        properties: {
          ...properties,
          $set: {
            ...properties?.$set,
          },
        },
      });
    } else {
      // For anonymous events, use a session ID or similar
      client.capture({
        distinctId: 'anonymous',
        event,
        properties,
      });
    }

    // Flush to ensure event is sent
    await client.flush();
  } catch (error) {
    // Log but don't throw - analytics should never break the app
    console.error('[PostHog] Error tracking event:', error);
  }
}

// Shutdown PostHog client (useful for cleanup in tests or shutdown hooks)
export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
