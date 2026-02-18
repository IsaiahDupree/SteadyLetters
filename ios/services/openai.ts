import { OPENAI_API_KEY } from '@/constants/config';

const BASE_URL = 'https://api.openai.com/v1';

async function openaiRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  if (!OPENAI_API_KEY) {
    throw new Error('AI service is not configured. Please add your OpenAI API key.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      const msg = err.error?.message || `API error ${response.status}`;
      if (response.status === 401) throw new Error('AI service authentication failed. Please check your API key.');
      if (response.status === 429) throw new Error('AI rate limit reached. Please wait a moment and try again.');
      if (response.status >= 500) throw new Error('AI service is temporarily unavailable. Please try again later.');
      throw new Error(msg);
    }

    return response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export type LetterTone = 'warm' | 'professional' | 'casual' | 'formal' | 'heartfelt';
export type LetterOccasion =
  | 'thank_you'
  | 'birthday'
  | 'congratulations'
  | 'thinking_of_you'
  | 'sympathy'
  | 'holiday'
  | 'business'
  | 'custom';

export interface GenerateLetterParams {
  occasion: LetterOccasion;
  tone: LetterTone;
  keyPoints?: string;
  recipientContext?: string;
  senderName?: string;
}

export async function generateLetter(params: GenerateLetterParams): Promise<string[]> {
  const systemPrompt = `You are a skilled letter writer. Generate 3 variations of a handwritten-style letter.
Each letter should be warm, genuine, and appropriate for the occasion.
Return ONLY a JSON array of 3 strings, each being a complete letter.`;

  const userPrompt = `Write 3 ${params.tone} letters for the occasion: ${params.occasion}.
${params.keyPoints ? `Key points to include: ${params.keyPoints}` : ''}
${params.recipientContext ? `Recipient context: ${params.recipientContext}` : ''}
${params.senderName ? `Sign as: ${params.senderName}` : ''}`;

  const data = await openaiRequest<{
    choices: Array<{ message: { content: string } }>;
  }>('/chat/completions', {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const content = data.choices[0]?.message?.content || '[]';
  try {
    return JSON.parse(content);
  } catch {
    return [content];
  }
}

export async function generateImages(prompt: string, n = 4): Promise<string[]> {
  const count = Math.min(Math.max(n, 1), 4);
  const fullPrompt = `Beautiful card/letter front image: ${prompt}. Artistic, warm, suitable for physical mail.`;

  // DALL-E 3 only supports n=1 per request — run parallel calls
  const requests = Array.from({ length: count }, () =>
    openaiRequest<{ data: Array<{ url: string }> }>('/images/generations', {
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  );

  const results = await Promise.all(requests);
  return results.map((r) => r.data[0]?.url).filter(Boolean);
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const formData = new FormData();

  const fileInfo = audioUri.split('/').pop() || 'recording.m4a';
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: fileInfo,
  } as unknown as Blob);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}

export async function extractAddress(text: string): Promise<{
  name: string;
  address: string;
  address2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}> {
  const data = await openaiRequest<{
    choices: Array<{ message: { content: string } }>;
  }>('/chat/completions', {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'Extract a structured US mailing address from the text. Return JSON with: name, address, address2 (optional), city, province (state abbreviation), postal_code, country. Return ONLY valid JSON.',
      },
      { role: 'user', content: text },
    ],
    temperature: 0,
    max_tokens: 300,
  });

  return JSON.parse(data.choices[0]?.message?.content || '{}');
}
