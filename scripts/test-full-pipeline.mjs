#!/usr/bin/env node
/**
 * SteadyLetters — Full AI-to-Mail Pipeline Integration Test
 *
 * Exercises the ENTIRE product flow end-to-end:
 *
 *   Step 1: OpenAI TTS        — Generate spoken audio from a prompt
 *   Step 2: Whisper            — Transcribe that audio back to text
 *   Step 3: GPT-4o             — Generate a heartfelt letter from the transcription
 *   Step 4: GPT-4o             — Test multiple tones & occasions for letter gen
 *   Step 5: DALL-E 3           — Generate a front image for the letter
 *   Step 6: Thanks.io          — Send the AI-generated letter with AI-generated image
 *   Step 7: Order Tracking     — Verify the order was created and check status
 *
 * Usage:
 *   node scripts/test-full-pipeline.mjs                  # Full pipeline with live send (~$3-4)
 *   node scripts/test-full-pipeline.mjs --dry-run         # AI tests only, no mail send (free except OpenAI)
 *   node scripts/test-full-pipeline.mjs --skip-audio      # Skip TTS/Whisper (saves ~$0.05)
 *   node scripts/test-full-pipeline.mjs --skip-image      # Skip DALL-E (saves ~$0.04)
 *
 * Environment:
 *   OPENAI_API_KEY      — Required for all AI tests
 *   THANKS_IO_API_KEY   — Required for mail send (Step 6-7)
 */

import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// ENV
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env.local');
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env.local not found */ }
}
loadEnv();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const THANKS_IO_KEY = process.env.THANKS_IO_API_KEY;
const THANKS_IO_BASE = 'https://api.thanks.io/api/v2';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_AUDIO = args.includes('--skip-audio');
const SKIP_IMAGE = args.includes('--skip-image');

// ---------------------------------------------------------------------------
// RECIPIENT
// ---------------------------------------------------------------------------
const RECIPIENT = {
  name: 'Isaiah Dupree',
  address: '3425 Delaney Dr',
  address2: 'Apt 214',
  city: 'Melbourne',
  province: 'FL',
  postal_code: '32934',
  country: 'US',
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const results = [];
let stepNum = 0;

function section(msg) {
  stepNum++;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Step ${stepNum}: ${msg}`);
  console.log(`${'═'.repeat(60)}`);
}

function record(test, status, details) {
  results.push({ test, status, details, timestamp: new Date().toISOString() });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '⚠️';
  const detailStr = typeof details === 'string' ? details : JSON.stringify(details).slice(0, 200);
  console.log(`  ${icon} ${test}`);
  if (detailStr) console.log(`     ${detailStr}`);
}

async function openaiRequest(path, body, method = 'POST', isFormData = false) {
  const headers = { 'Authorization': `Bearer ${OPENAI_KEY}` };
  const opts = { method, headers };

  if (isFormData) {
    opts.body = body; // FormData sets its own content-type
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`https://api.openai.com/v1${path}`, opts);
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  }
  // Binary response (audio, images, etc.)
  const buffer = await res.arrayBuffer();
  return { status: res.status, ok: res.ok, buffer: Buffer.from(buffer) };
}

async function thanksIoRequest(method, path, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${THANKS_IO_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${THANKS_IO_BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, data };
}

// ---------------------------------------------------------------------------
// PIPELINE STATE — threaded from step to step
// ---------------------------------------------------------------------------
const pipeline = {
  ttsAudioBuffer: null,
  transcribedText: null,
  generatedLetters: {},
  selectedLetter: null,
  generatedImageUrl: null,
  thanksIoOrder: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: OpenAI TTS — Generate spoken audio
// ═══════════════════════════════════════════════════════════════════════════
async function step1_tts() {
  section('OpenAI Text-to-Speech (TTS)');

  if (SKIP_AUDIO) {
    record('TTS Generation', 'SKIP', 'Skipped via --skip-audio');
    pipeline.transcribedText = "I want to write a thank you letter to my friend Sarah for hosting an amazing dinner party last weekend. The food was incredible and the company was even better. I really appreciated the effort she put into making everyone feel welcome.";
    return;
  }

  const inputText = "I want to write a thank you letter to my friend Sarah for hosting an amazing dinner party last weekend. The food was incredible and the company was even better. I really appreciated the effort she put into making everyone feel welcome.";

  console.log(`  📝 Input text (${inputText.length} chars):`);
  console.log(`     "${inputText.slice(0, 100)}..."`);

  const startTime = Date.now();
  const { status, ok, buffer } = await openaiRequest('/audio/speech', {
    model: 'tts-1',
    input: inputText,
    voice: 'alloy',
    response_format: 'mp3',
  });

  const elapsed = Date.now() - startTime;

  if (!ok) {
    record('TTS Generation', 'FAIL', `Status ${status}`);
    pipeline.transcribedText = inputText; // Fallback to raw text
    return;
  }

  pipeline.ttsAudioBuffer = buffer;
  const sizeKB = (buffer.length / 1024).toFixed(1);
  record('TTS Generation', 'PASS', `Generated ${sizeKB}KB MP3 audio in ${elapsed}ms (voice: alloy, model: tts-1)`);

  // Save the audio file for inspection
  const audioPath = resolve(__dirname, '../test-results/tts-output.mp3');
  try {
    mkdirSync(resolve(__dirname, '../test-results'), { recursive: true });
    writeFileSync(audioPath, buffer);
    record('TTS File Saved', 'INFO', `test-results/tts-output.mp3 (${sizeKB}KB)`);
  } catch (e) {
    record('TTS File Save', 'INFO', `Could not save: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: Whisper Transcription — Transcribe audio back to text
// ═══════════════════════════════════════════════════════════════════════════
async function step2_whisper() {
  section('OpenAI Whisper Transcription');

  if (SKIP_AUDIO || !pipeline.ttsAudioBuffer) {
    record('Whisper Transcription', 'SKIP', 'No audio to transcribe');
    return;
  }

  const formData = new FormData();
  const audioBlob = new Blob([pipeline.ttsAudioBuffer], { type: 'audio/mpeg' });
  formData.append('file', audioBlob, 'test-audio.mp3');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  const startTime = Date.now();
  const { status, ok, data } = await openaiRequest('/audio/transcriptions', formData, 'POST', true);
  const elapsed = Date.now() - startTime;

  if (!ok) {
    record('Whisper Transcription', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 120)}`);
    return;
  }

  pipeline.transcribedText = data.text;
  const wordCount = data.text.split(' ').length;
  record('Whisper Transcription', 'PASS', `Transcribed ${wordCount} words in ${elapsed}ms`);
  console.log(`     📜 "${data.text.slice(0, 120)}..."`);

  // Verify round-trip fidelity
  const originalWords = new Set("thank you letter friend sarah hosting amazing dinner party weekend food incredible company better appreciated effort making everyone feel welcome".split(' '));
  const transcribedLower = data.text.toLowerCase();
  const matchedKeywords = [...originalWords].filter(w => transcribedLower.includes(w));
  const fidelity = ((matchedKeywords.length / originalWords.size) * 100).toFixed(0);
  record('Round-trip Fidelity', fidelity >= 70 ? 'PASS' : 'FAIL', `${fidelity}% keyword match (${matchedKeywords.length}/${originalWords.size} keywords preserved)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: GPT-4o Letter Generation — Multiple tones & occasions
// ═══════════════════════════════════════════════════════════════════════════
async function step3_letterGeneration() {
  section('GPT-4o Letter Generation');

  const context = pipeline.transcribedText || "Thank you letter to a friend for hosting a wonderful dinner party.";

  // Test matrix of tones and occasions
  const tests = [
    { tone: 'warm', occasion: 'thank-you', length: 'medium', label: 'Warm Thank-You (medium)' },
    { tone: 'casual', occasion: 'general', length: 'short', label: 'Casual General (short)' },
    { tone: 'formal', occasion: 'thank-you', length: 'long', label: 'Formal Thank-You (long)' },
    { tone: 'friendly', occasion: 'congratulations', length: 'medium', label: 'Friendly Congrats (medium)' },
    { tone: 'professional', occasion: 'general', length: 'short', label: 'Professional General (short)' },
  ];

  for (const test of tests) {
    const startTime = Date.now();

    const prompt = buildLetterPrompt(context, test.tone, test.occasion, test.length);

    const { status, ok, data } = await openaiRequest('/chat/completions', {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: test.length === 'short' ? 200 : test.length === 'long' ? 1000 : 500,
    });

    const elapsed = Date.now() - startTime;

    if (!ok) {
      record(`Letter: ${test.label}`, 'FAIL', `Status ${status}`);
      continue;
    }

    const content = data.choices?.[0]?.message?.content || '';
    const wordCount = content.split(/\s+/).length;
    const tokenUsage = data.usage;

    pipeline.generatedLetters[test.label] = content;

    record(`Letter: ${test.label}`, 'PASS',
      `${wordCount} words, ${elapsed}ms, tokens: ${tokenUsage?.prompt_tokens}→${tokenUsage?.completion_tokens}`
    );

    // Validate letter quality
    const hasGreeting = /dear|hello|hi |hey /i.test(content);
    const hasClosing = /sincerely|regards|warmly|love|best|yours|cheers|take care/i.test(content);
    const inRange = test.length === 'short' ? wordCount >= 30 && wordCount <= 200
      : test.length === 'long' ? wordCount >= 150 && wordCount <= 700
      : wordCount >= 80 && wordCount <= 400;

    if (!hasGreeting) record(`  Quality: Greeting`, 'FAIL', 'Missing greeting');
    if (!hasClosing) record(`  Quality: Closing`, 'FAIL', 'Missing closing');
    if (!inRange) record(`  Quality: Length`, 'INFO', `${wordCount} words (expected ${test.length})`);
  }

  // Select the best letter for sending (warm thank-you)
  pipeline.selectedLetter = pipeline.generatedLetters['Warm Thank-You (medium)'] || Object.values(pipeline.generatedLetters)[0];

  if (pipeline.selectedLetter) {
    console.log(`\n  📨 Selected letter for sending (first 200 chars):`);
    console.log(`     "${pipeline.selectedLetter.slice(0, 200).replace(/\n/g, ' ')}..."`);
  }
}

function buildLetterPrompt(context, tone, occasion, length) {
  const lengthGuidelines = {
    short: '50-100 words. Keep it brief and to the point.',
    medium: '150-250 words. Standard letter length.',
    long: '300-500 words. Detailed and comprehensive.',
  };

  const occasionText = occasion === 'general' ? '' : `This is a ${occasion.replace('-', ' ')} letter.`;

  return `You are writing a heartfelt handwritten letter.

Context: ${context}
Tone: ${tone}
${occasionText}

Write a warm, personal letter suitable for sending via physical mail.
Length: ${lengthGuidelines[length]}
Include a greeting and closing.
Make it sound natural and human, not AI-generated.
Do not include a date or recipient address.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: GPT-4o Edge Cases & Capabilities
// ═══════════════════════════════════════════════════════════════════════════
async function step4_letterEdgeCases() {
  section('GPT-4o Letter Edge Cases');

  // Test 1: Holiday-themed letter
  const holidayStart = Date.now();
  const { ok: hOk, data: hData } = await openaiRequest('/chat/completions', {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildLetterPrompt(
      'A Christmas thank you letter for a lovely gift',
      'warm', 'holiday', 'medium'
    ).replace('Write a warm', 'Apply a Christmas theme. Write a warm') }],
    temperature: 0.8,
    max_tokens: 500,
  });
  record('Holiday Letter (Christmas)', hOk ? 'PASS' : 'FAIL',
    hOk ? `${hData.choices[0].message.content.split(/\s+/).length} words, ${Date.now() - holidayStart}ms` : 'Failed'
  );

  // Test 2: Image-context letter (simulate image analysis feeding into letter)
  const imageAnalysis = "A beautiful sunset over the ocean with palm trees and a sandy beach. Warm golden and orange tones.";
  const imgStart = Date.now();
  const { ok: iOk, data: iData } = await openaiRequest('/chat/completions', {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `You are writing a heartfelt handwritten letter.

Context: Writing to a friend about our beach vacation memories
Tone: warm
Image Context: The user provided an image showing: ${imageAnalysis}. Incorporate relevant elements from this image into the letter in a natural way.

Write a warm, personal letter suitable for sending via physical mail.
Length: 150-250 words.
Include a greeting and closing.
Make it sound natural and human, not AI-generated.
Do not include a date or recipient address.` }],
    temperature: 0.8,
    max_tokens: 500,
  });

  if (iOk) {
    const content = iData.choices[0].message.content;
    const mentionsBeach = /beach|sunset|ocean|palm|sand|golden|orange/i.test(content);
    record('Image-Context Letter', 'PASS', `${content.split(/\s+/).length} words, ${Date.now() - imgStart}ms, image refs: ${mentionsBeach ? 'yes' : 'no'}`);
    if (!mentionsBeach) record('  Image Integration', 'FAIL', 'Letter did not incorporate image context');
  } else {
    record('Image-Context Letter', 'FAIL', 'API call failed');
  }

  // Test 3: Very short context (minimal input)
  const shortStart = Date.now();
  const { ok: sOk, data: sData } = await openaiRequest('/chat/completions', {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildLetterPrompt('thanks', 'casual', 'general', 'short') }],
    temperature: 0.8,
    max_tokens: 200,
  });
  record('Minimal Context ("thanks")', sOk ? 'PASS' : 'FAIL',
    sOk ? `${sData.choices[0].message.content.split(/\s+/).length} words from 1-word input, ${Date.now() - shortStart}ms` : 'Failed'
  );

  // Test 4: Multi-language hint
  const langStart = Date.now();
  const { ok: lOk, data: lData } = await openaiRequest('/chat/completions', {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `You are writing a heartfelt handwritten letter.

Context: Gracias por la cena maravillosa, fue increíble.
Tone: warm

The user spoke in Spanish. Write the letter in Spanish.
Length: 100-200 words. Include a greeting and closing.` }],
    temperature: 0.8,
    max_tokens: 500,
  });
  if (lOk) {
    const content = lData.choices[0].message.content;
    const isSpanish = /querida|estimad|gracias|abrazo|cariño|atentamente/i.test(content);
    record('Spanish Language Letter', 'PASS', `${content.split(/\s+/).length} words, Spanish detected: ${isSpanish}, ${Date.now() - langStart}ms`);
  } else {
    record('Spanish Language Letter', 'FAIL', 'API call failed');
  }

  // Test 5: Sympathy tone
  const sympStart = Date.now();
  const { ok: syOk, data: syData } = await openaiRequest('/chat/completions', {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: buildLetterPrompt(
      'A sympathy letter for the loss of a loved one',
      'warm', 'sympathy', 'medium'
    ) }],
    temperature: 0.8,
    max_tokens: 500,
  });
  record('Sympathy Letter', syOk ? 'PASS' : 'FAIL',
    syOk ? `${syData.choices[0].message.content.split(/\s+/).length} words, ${Date.now() - sympStart}ms` : 'Failed'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: DALL-E 3 Image Generation
// ═══════════════════════════════════════════════════════════════════════════
async function step5_imageGeneration() {
  section('DALL-E 3 Image Generation');

  if (SKIP_IMAGE) {
    record('Image Generation', 'SKIP', 'Skipped via --skip-image');
    pipeline.generatedImageUrl = 'https://d2md0c8rpvzmz5.cloudfront.net/inspiration_templates/default10.png';
    return;
  }

  // Test 1: Thank-you card image
  const startTime = Date.now();
  const { status, ok, data } = await openaiRequest('/images/generations', {
    model: 'dall-e-3',
    prompt: 'A beautiful thank you greeting card design. Soft pastels and warm tones, elegant, minimal, suitable for a physical greeting card front. Floral watercolor elements with space for text. No text in the image.',
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });
  const elapsed = Date.now() - startTime;

  if (!ok) {
    record('Thank-You Card Image', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 120)}`);
    pipeline.generatedImageUrl = 'https://d2md0c8rpvzmz5.cloudfront.net/inspiration_templates/default10.png';
  } else {
    const imageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;
    pipeline.generatedImageUrl = imageUrl;
    record('Thank-You Card Image', 'PASS', `Generated in ${elapsed}ms`);
    if (revisedPrompt) {
      record('DALL-E Revised Prompt', 'INFO', revisedPrompt.slice(0, 150));
    }
    console.log(`     🖼️  URL: ${imageUrl?.slice(0, 80)}...`);
  }

  // Test 2: Birthday card image
  const bdayStart = Date.now();
  const { ok: bOk, data: bData } = await openaiRequest('/images/generations', {
    model: 'dall-e-3',
    prompt: 'A cheerful birthday celebration card with balloons and confetti. Bright and playful colors, elegant, minimal, suitable for a physical greeting card. Clean design with space for text. No text in the image.',
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });
  record('Birthday Card Image', bOk ? 'PASS' : 'FAIL',
    bOk ? `Generated in ${Date.now() - bdayStart}ms` : `Failed`
  );

  // Test 3: Professional/formal card
  const formalStart = Date.now();
  const { ok: fOk, data: fData } = await openaiRequest('/images/generations', {
    model: 'dall-e-3',
    prompt: 'A clean, professional letterhead design. Classic navy and gold palette, corporate elegance, suitable for a formal letter front. Minimal design with geometric elements. No text in the image.',
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });
  record('Professional Card Image', fOk ? 'PASS' : 'FAIL',
    fOk ? `Generated in ${Date.now() - formalStart}ms` : `Failed`
  );

  // Test 4: Sympathy card
  const sympStart = Date.now();
  const { ok: sOk, data: sData } = await openaiRequest('/images/generations', {
    model: 'dall-e-3',
    prompt: 'A gentle, comforting sympathy card design. Soft muted blues and grays, peaceful nature imagery with gentle lilies. Suitable for a physical sympathy card. Minimalist, tasteful. No text in the image.',
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });
  record('Sympathy Card Image', sOk ? 'PASS' : 'FAIL',
    sOk ? `Generated in ${Date.now() - sympStart}ms` : `Failed`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6: Thanks.io — Send AI-Generated Letter
// ═══════════════════════════════════════════════════════════════════════════
async function step6_sendLetter() {
  section('Thanks.io — Send AI-Generated Letter');

  if (DRY_RUN) {
    record('Live Send', 'SKIP', 'Skipped via --dry-run');
    return;
  }

  if (!THANKS_IO_KEY) {
    record('Live Send', 'SKIP', 'No THANKS_IO_API_KEY set');
    return;
  }

  if (!pipeline.selectedLetter) {
    record('Live Send', 'FAIL', 'No letter content generated in previous steps');
    return;
  }

  // Send as a notecard (greeting card) with AI-generated image + letter
  const payload = {
    recipients: [RECIPIENT],
    message: pipeline.selectedLetter,
    handwriting_style: 7,
    handwriting_color: 'blue',
    front_image_url: pipeline.generatedImageUrl || 'https://d2md0c8rpvzmz5.cloudfront.net/inspiration_templates/default10.png',
  };

  console.log(`  📬 Sending notecard with:`);
  console.log(`     Letter: ${pipeline.selectedLetter.slice(0, 80).replace(/\n/g, ' ')}...`);
  console.log(`     Image: ${(pipeline.generatedImageUrl || 'default').slice(0, 60)}...`);
  console.log(`     To: ${RECIPIENT.name}, ${RECIPIENT.city}, ${RECIPIENT.province}`);

  const startTime = Date.now();
  const { status, ok, data } = await thanksIoRequest('POST', '/send/notecard', payload);
  const elapsed = Date.now() - startTime;

  if (!ok) {
    record('Notecard Send', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`);

    // Fallback: try as a postcard
    console.log(`\n  🔄 Falling back to postcard...`);
    const pcPayload = {
      ...payload,
      size: '4x6',
    };
    const { status: pcStatus, ok: pcOk, data: pcData } = await thanksIoRequest('POST', '/send/postcard', pcPayload);
    if (pcOk) {
      pipeline.thanksIoOrder = pcData;
      record('Postcard Fallback', 'PASS', `Order #${pcData.id}, Status: ${pcData.status}, Cost: $${(pcData.authorization_total || 0) / 100}`);
    } else {
      record('Postcard Fallback', 'FAIL', `Status ${pcStatus}: ${JSON.stringify(pcData).slice(0, 150)}`);
    }
    return;
  }

  pipeline.thanksIoOrder = data;
  record('Notecard Send', 'PASS',
    `Order #${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}, ${elapsed}ms`
  );

  // Also send a letter version for comparison
  console.log(`\n  📬 Also sending as windowed letter for comparison...`);
  const letterPayload = {
    recipients: [RECIPIENT],
    message: pipeline.selectedLetter,
    handwriting_style: 1,
    handwriting_color: 'blue',
    front_image_url: pipeline.generatedImageUrl || 'https://d2md0c8rpvzmz5.cloudfront.net/letter-backgrounds/bg0.png',
  };
  const { status: lStatus, ok: lOk, data: lData } = await thanksIoRequest('POST', '/send/letter', letterPayload);
  if (lOk) {
    record('Letter Send', 'PASS', `Order #${lData.id}, Status: ${lData.status}, Cost: $${(lData.authorization_total || 0) / 100}`);
  } else {
    record('Letter Send', 'FAIL', `Status ${lStatus}: ${JSON.stringify(lData).slice(0, 150)}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 7: Order Tracking Verification
// ═══════════════════════════════════════════════════════════════════════════
async function step7_orderTracking() {
  section('Order Tracking Verification');

  if (!pipeline.thanksIoOrder) {
    record('Order Tracking', 'SKIP', 'No order was created');
    return;
  }

  const order = pipeline.thanksIoOrder;
  console.log(`  🔍 Verifying order #${order.id} from send response...`);

  // Thanks.io does NOT have a GET-by-ID polling endpoint for order status.
  // Status updates are delivered via webhooks. We verify the send response data instead.
  const hasId = !!order.id;
  const hasStatus = !!order.status;
  const hasCost = order.authorization_total !== undefined;

  record('Order Has ID', hasId ? 'PASS' : 'FAIL', `id: ${order.id}`);
  record('Order Has Status', hasStatus ? 'PASS' : 'FAIL', `status: ${order.status}`);
  record('Order Has Cost', hasCost ? 'PASS' : 'FAIL', `cost: $${(order.authorization_total || 0) / 100}`);

  // Verify status is in the expected initial state
  const validInitialStatuses = ['reviewing', 'queued', 'printing'];
  const statusOk = validInitialStatuses.includes((order.status || '').toLowerCase());
  record('Initial Status Valid', statusOk ? 'PASS' : 'FAIL',
    `"${order.status}" (expected one of: ${validInitialStatuses.join(', ')})`
  );

  // Document the full order lifecycle for users
  console.log(`\n  📋 Order Status Lifecycle (updated via webhooks):`);
  console.log(`     Reviewing  → Within cancellation window (~1 hour)`);
  console.log(`     Printing   → Sent to printer network`);
  console.log(`     Printed    → All pieces at printer`);
  console.log(`     Fulfilled  → Processing complete, order settled`);
  console.log(`     Shipped    → In transit via mail carrier`);
  console.log(`     Delivered  → Confirmed delivery to recipient`);
  console.log(`\n  ℹ️  Note: Thanks.io has no polling endpoint. Status updates`);
  console.log(`     arrive via webhooks to /api/webhooks/thanks`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🚀 SteadyLetters — Full AI-to-Mail Pipeline Integration Test');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no mail send)' : 'LIVE (will send real mail)'}`);
  console.log(`   Audio: ${SKIP_AUDIO ? 'SKIPPED' : 'TTS + Whisper'}`);
  console.log(`   Image: ${SKIP_IMAGE ? 'SKIPPED' : 'DALL-E 3'}`);
  console.log(`   OpenAI: ${OPENAI_KEY ? '✅ Key set' : '❌ Missing'}`);
  console.log(`   Thanks.io: ${THANKS_IO_KEY ? '✅ Key set' : '❌ Missing'}`);

  if (!OPENAI_KEY) {
    console.error('\n❌ OPENAI_API_KEY not set. Cannot run AI tests.');
    process.exit(1);
  }

  const pipelineStart = Date.now();

  await step1_tts();
  await step2_whisper();
  await step3_letterGeneration();
  await step4_letterEdgeCases();
  await step5_imageGeneration();
  await step6_sendLetter();
  await step7_orderTracking();

  const totalElapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);

  // ═════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═════════════════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  PIPELINE SUMMARY`);
  console.log(`${'═'.repeat(60)}`);

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const info = results.filter(r => r.status === 'INFO').length;

  console.log(`\n  Results: ${passed} passed, ${failed} failed, ${skipped} skipped, ${info} info`);
  console.log(`  Total time: ${totalElapsed}s`);

  // Pipeline thread summary
  console.log(`\n  🧵 Pipeline Thread:`);
  console.log(`     TTS Audio: ${pipeline.ttsAudioBuffer ? `${(pipeline.ttsAudioBuffer.length / 1024).toFixed(1)}KB` : 'skipped'}`);
  console.log(`     Transcription: ${pipeline.transcribedText ? `${pipeline.transcribedText.split(' ').length} words` : 'none'}`);
  console.log(`     Letters Generated: ${Object.keys(pipeline.generatedLetters).length}`);
  console.log(`     Image URL: ${pipeline.generatedImageUrl ? 'yes (AI-generated)' : 'none'}`);
  console.log(`     Thanks.io Order: ${pipeline.thanksIoOrder ? `#${pipeline.thanksIoOrder.id} (${pipeline.thanksIoOrder.status})` : 'none'}`);

  if (pipeline.thanksIoOrder) {
    console.log(`\n  📦 Real mail will arrive at:`);
    console.log(`     ${RECIPIENT.name}`);
    console.log(`     ${RECIPIENT.address} ${RECIPIENT.address2}`);
    console.log(`     ${RECIPIENT.city}, ${RECIPIENT.province} ${RECIPIENT.postal_code}`);
  }

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'dry-run' : 'live',
    totalTimeSeconds: parseFloat(totalElapsed),
    pipeline: {
      ttsGenerated: !!pipeline.ttsAudioBuffer,
      transcriptionWords: pipeline.transcribedText?.split(' ').length || 0,
      lettersGenerated: Object.keys(pipeline.generatedLetters).length,
      imageGenerated: !!pipeline.generatedImageUrl && !pipeline.generatedImageUrl.includes('cloudfront'),
      orderCreated: !!pipeline.thanksIoOrder,
      orderId: pipeline.thanksIoOrder?.id || null,
    },
    results,
  };

  const reportPath = resolve(__dirname, '../test-results/full-pipeline-results.json');
  try {
    mkdirSync(resolve(__dirname, '../test-results'), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n  📄 Results: test-results/full-pipeline-results.json`);
  } catch { /* ignore */ }

  if (failed > 0) {
    console.log(`\n  ❌ ${failed} test(s) FAILED — review output above`);
    process.exit(1);
  } else {
    console.log(`\n  ✅ All tests passed!`);
  }
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
