export interface ThanksIoConfig {
  apiKey: string;
  testMode?: boolean;
}

export class ThanksIoClient {
  private baseUrl = 'https://api.thanks.io/api/v2';
  private apiKey: string;

  constructor(config: ThanksIoConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Thanks.io API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getHandwritingStyles() {
    return this.request<{ data: any[] }>('/handwriting-styles');
  }

  async createOrder(order: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }
}

export const thanksIo = new ThanksIoClient({
  apiKey: process.env.THANKS_IO_API_KEY || '',
  testMode: process.env.NODE_ENV !== 'production',
});
