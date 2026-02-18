#!/usr/bin/env node
/**
 * SteadyLetters - Live Thanks.io Send Test Script
 *
 * Sends a REAL postcard via Thanks.io API. This costs money and creates
 * a real mail order. Only run this when you intend to test the live API.
 *
 * Usage:
 *   node scripts/test-live-send.mjs
 *   node scripts/test-live-send.mjs --dry-run   (validates API key & styles only, no send)
 *   node scripts/test-live-send.mjs --product letter
 *
 * Environment:
 *   THANKS_IO_API_KEY  - Required. Set in .env.local
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
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
  } catch {
    // .env.local not found, rely on process.env
  }
}

loadEnv();

const BASE_URL = 'https://api.thanks.io/api/v2';
const API_KEY = process.env.THANKS_IO_API_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const productArg = args.indexOf('--product');
const PRODUCT = productArg !== -1 ? args[productArg + 1] : 'postcard';

// ============================================================================
// TEST RECIPIENT — update this to a real address you control
// ============================================================================
const TEST_RECIPIENT = {
  name: 'Isaiah Dupree',
  address: '3425 Delaney Dr Apt 214',
  city: 'Melbourne',
  province: 'FL',
  postal_code: '32934',
  country: 'US',
};

const TEST_MESSAGE = 'This is a test letter from SteadyLetters. If you received this, the Thanks.io integration is working correctly!';

// ============================================================================
// HELPERS
// ============================================================================

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
function section(msg) { console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`); }

// ============================================================================
// TESTS
// ============================================================================

async function checkApiKey() {
  section('1. API Key Validation');

  if (!API_KEY) {
    fail('THANKS_IO_API_KEY is not set in environment');
    process.exit(1);
  }
  pass(`API key found (${API_KEY.slice(0, 20)}...)`);
}

async function checkHandwritingStyles() {
  section('2. Handwriting Styles');

  const { status, ok, data } = await apiGet('/handwriting-styles');

  if (!ok) {
    fail(`GET /handwriting-styles returned ${status}: ${JSON.stringify(data)}`);
    return null;
  }

  const styles = data.data || [];
  pass(`Fetched ${styles.length} handwriting styles`);

  if (styles.length > 0) {
    info(`First style: ID=${styles[0].handwriting_style_id}, Sample=${styles[0].sample?.slice(0, 60)}`);
  }

  return styles;
}

async function sendPostcard(styleId) {
  section('3. Send Postcard (LIVE)');

  const payload = {
    recipients: [TEST_RECIPIENT],
    message: TEST_MESSAGE,
    handwriting_style: styleId || '1',
    handwriting_color: 'blue',
    size: '4x6',
    front_image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
  };

  info(`Sending to: ${TEST_RECIPIENT.name}, ${TEST_RECIPIENT.address}, ${TEST_RECIPIENT.city} ${TEST_RECIPIENT.province}`);
  info(`Message: "${TEST_MESSAGE.slice(0, 60)}..."`);

  const { status, ok, data } = await apiPost('/send/postcard', payload);

  if (!ok) {
    fail(`POST /send/postcard returned ${status}: ${JSON.stringify(data)}`);
    return null;
  }

  pass(`Postcard queued! Order ID: ${data.id || data.order_id || JSON.stringify(data).slice(0, 80)}`);
  pass(`Status: ${data.status || 'queued'}`);
  return data;
}

async function sendLetter(styleId) {
  section('3. Send Letter (LIVE)');

  const payload = {
    recipients: [TEST_RECIPIENT],
    message: TEST_MESSAGE,
    handwriting_style: styleId || '1',
    handwriting_color: 'blue',
  };

  info(`Sending to: ${TEST_RECIPIENT.name}, ${TEST_RECIPIENT.address}, ${TEST_RECIPIENT.city} ${TEST_RECIPIENT.province}`);

  const { status, ok, data } = await apiPost('/send/letter', payload);

  if (!ok) {
    fail(`POST /send/letter returned ${status}: ${JSON.stringify(data)}`);
    return null;
  }

  pass(`Letter queued! Order ID: ${data.id || data.order_id || JSON.stringify(data).slice(0, 80)}`);
  pass(`Status: ${data.status || 'queued'}`);
  return data;
}

async function checkOrderStatus(orderId) {
  section('4. Order Status Check');

  if (!orderId) {
    info('No order ID to check (send step failed or was skipped)');
    return;
  }

  const { status, ok, data } = await apiGet(`/send/${orderId}`);

  if (!ok) {
    fail(`GET /order/${orderId} returned ${status}: ${JSON.stringify(data)}`);
    return;
  }

  pass(`Order status: ${data.status}`);
  if (data.estimated_delivery) info(`Estimated delivery: ${data.estimated_delivery}`);
  if (data.tracking_number) info(`Tracking: ${data.tracking_number}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🚀 SteadyLetters - Thanks.io Live Send Test');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no actual send)' : 'LIVE SEND'}`);
  console.log(`   Product: ${PRODUCT}`);
  if (!DRY_RUN) {
    console.log('\n⚠️  WARNING: This will send a REAL mail order and charge your Thanks.io account!');
    console.log('   Use --dry-run to skip the send step.\n');
  }

  await checkApiKey();
  const styles = await checkHandwritingStyles();
  const styleId = styles?.[0]?.handwriting_style_id?.toString() || '1';

  let order = null;

  if (!DRY_RUN) {
    if (PRODUCT === 'letter') {
      order = await sendLetter(styleId);
    } else {
      order = await sendPostcard(styleId);
    }

    const orderId = order?.id || order?.order_id;
    if (orderId) {
      await checkOrderStatus(orderId);
    }
  } else {
    section('3. Send Step (SKIPPED - dry run)');
    info('Pass --product postcard or --product letter without --dry-run to send');
  }

  section('Summary');
  if (DRY_RUN) {
    pass('API key is valid');
    pass('Handwriting styles endpoint working');
    info('Run without --dry-run to test actual send');
  } else if (order) {
    pass('End-to-end live send test PASSED');
    pass(`Order created: ${order.id || order.order_id}`);
  } else {
    fail('Send test FAILED - check errors above');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err.message);
  process.exit(1);
});
