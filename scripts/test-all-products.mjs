#!/usr/bin/env node
/**
 * SteadyLetters — Comprehensive Thanks.io Product Test Suite
 *
 * Tests ALL mail product types against the live Thanks.io API:
 *   1. Postcard 4x6
 *   2. Postcard 6x9
 *   3. Postcard 6x11
 *   4. Letter (windowed)
 *   5. Notecard (greeting card)
 *   6. Windowless Letter (PDF)
 *   7. Giftcard (Amazon $5)
 *   8. Preview mode (no charge)
 *   9. Order status tracking
 *
 * Usage:
 *   node scripts/test-all-products.mjs                   # Run ALL tests (costs ~$15-20)
 *   node scripts/test-all-products.mjs --preview-only     # Preview mode only (FREE)
 *   node scripts/test-all-products.mjs --product postcard  # Single product
 *   node scripts/test-all-products.mjs --skip giftcard     # Skip expensive tests
 *
 * Environment:
 *   THANKS_IO_API_KEY — Required. Set in .env.local
 */

import { readFileSync, writeFileSync } from 'fs';
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

const BASE_URL = 'https://api.thanks.io/api/v2';
const API_KEY = process.env.THANKS_IO_API_KEY;

const args = process.argv.slice(2);
const PREVIEW_ONLY = args.includes('--preview-only');
const skipIdx = args.indexOf('--skip');
const SKIP = skipIdx !== -1 ? args[skipIdx + 1] : null;
const productIdx = args.indexOf('--product');
const SINGLE_PRODUCT = productIdx !== -1 ? args[productIdx + 1] : null;

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

const MESSAGE = 'SteadyLetters integration test — sent via Thanks.io API. If you received this, the integration is working. Test ID: ' + Date.now();

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, data };
}

const results = [];
function record(test, status, details) {
  results.push({ test, status, details, timestamp: new Date().toISOString() });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} ${test}: ${typeof details === 'string' ? details : JSON.stringify(details).slice(0, 120)}`);
}

function section(msg) { console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`); }
function shouldRun(name) {
  if (SINGLE_PRODUCT && name !== SINGLE_PRODUCT) return false;
  if (SKIP && name === SKIP) return false;
  return true;
}

// ---------------------------------------------------------------------------
// 1. HANDWRITING STYLES
// ---------------------------------------------------------------------------
async function testHandwritingStyles() {
  section('1. Handwriting Styles');
  const { status, ok, data } = await api('GET', '/handwriting-styles');

  if (!ok) { record('Fetch styles', 'FAIL', `Status ${status}`); return null; }

  const styles = data.data || [];
  record('Fetch styles', 'PASS', `${styles.length} styles available`);

  const realistic = styles.filter(s => s.type === 'Realistic');
  const ai = styles.filter(s => s.type === 'AI');
  const intl = styles.filter(s => s.type === 'International');
  record('Style types', 'INFO', `Realistic: ${realistic.length}, AI: ${ai.length}, International: ${intl.length}`);

  return styles;
}

// ---------------------------------------------------------------------------
// 2. POSTCARD 4x6
// ---------------------------------------------------------------------------
async function testPostcard4x6() {
  if (!shouldRun('postcard')) return null;
  section('2. Postcard 4x6');

  const payload = {
    recipients: [RECIPIENT],
    message: MESSAGE,
    handwriting_style: 1,
    handwriting_color: 'blue',
    size: '4x6',
    front_image_url: 'https://d2md0c8rpvzmz5.cloudfront.net/inspiration_templates/default10.png',
    ...(PREVIEW_ONLY ? { preview: true } : {}),
  };

  const { status, ok, data } = await api('POST', '/send/postcard', payload);

  if (PREVIEW_ONLY && ok) {
    record('Postcard 4x6 preview', 'PASS', `Preview generated`);
    if (data.data?.previews) record('Preview URLs', 'INFO', data.data.previews.join(', ').slice(0, 100));
    return data;
  }

  if (!ok) { record('Postcard 4x6', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`); return null; }

  record('Postcard 4x6', 'PASS', `Order ID: ${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}`);
  return data;
}

// ---------------------------------------------------------------------------
// 3. POSTCARD 6x9
// ---------------------------------------------------------------------------
async function testPostcard6x9() {
  if (!shouldRun('postcard6x9')) return null;
  section('3. Postcard 6x9');

  const payload = {
    recipients: [RECIPIENT],
    message: MESSAGE,
    handwriting_style: 4,
    handwriting_color: 'black',
    size: '6x9',
    front_image_url: 'https://d2md0c8rpvzmz5.cloudfront.net/inspiration_templates/default10.png',
    ...(PREVIEW_ONLY ? { preview: true } : {}),
  };

  const { status, ok, data } = await api('POST', '/send/postcard', payload);

  if (PREVIEW_ONLY && ok) {
    record('Postcard 6x9 preview', 'PASS', `Preview generated`);
    return data;
  }
  if (!ok) { record('Postcard 6x9', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`); return null; }

  record('Postcard 6x9', 'PASS', `Order ID: ${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}`);
  return data;
}

// ---------------------------------------------------------------------------
// 4. POSTCARD 6x11
// ---------------------------------------------------------------------------
async function testPostcard6x11() {
  if (!shouldRun('postcard6x11')) return null;
  section('4. Postcard 6x11');

  const payload = {
    recipients: [RECIPIENT],
    message: MESSAGE,
    handwriting_style: 101,
    handwriting_color: '#4287f5',
    size: '6x11',
    front_image_url: 'https://d2md0c8rpvzmz5.cloudfront.net/inspiration_templates/default10.png',
    ...(PREVIEW_ONLY ? { preview: true } : {}),
  };

  const { status, ok, data } = await api('POST', '/send/postcard', payload);

  if (PREVIEW_ONLY && ok) {
    record('Postcard 6x11 preview', 'PASS', `Preview generated`);
    return data;
  }
  if (!ok) { record('Postcard 6x11', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`); return null; }

  record('Postcard 6x11', 'PASS', `Order ID: ${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}`);
  return data;
}

// ---------------------------------------------------------------------------
// 5. LETTER (Windowed)
// ---------------------------------------------------------------------------
async function testLetter() {
  if (!shouldRun('letter')) return null;
  section('5. Windowed Letter');

  const payload = {
    recipients: [RECIPIENT],
    message: MESSAGE,
    handwriting_style: 7,
    handwriting_color: 'blue',
    front_image_url: 'https://d2md0c8rpvzmz5.cloudfront.net/letter-backgrounds/bg0.png',
    ...(PREVIEW_ONLY ? { preview: true } : {}),
  };

  const { status, ok, data } = await api('POST', '/send/letter', payload);

  if (PREVIEW_ONLY && ok) {
    record('Letter preview', 'PASS', `Preview generated`);
    return data;
  }
  if (!ok) { record('Letter', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`); return null; }

  record('Letter', 'PASS', `Order ID: ${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}`);
  return data;
}

// ---------------------------------------------------------------------------
// 6. NOTECARD (Greeting Card)
// ---------------------------------------------------------------------------
async function testNotecard() {
  if (!shouldRun('notecard')) return null;
  section('6. Notecard (Greeting Card)');

  const payload = {
    recipients: [RECIPIENT],
    message: MESSAGE,
    handwriting_style: 1,
    handwriting_color: 'green',
    front_image_url: 'https://d2md0c8rpvzmz5.cloudfront.net/notecard-inspirations/note1.png',
    ...(PREVIEW_ONLY ? { preview: true } : {}),
  };

  const { status, ok, data } = await api('POST', '/send/notecard', payload);

  if (PREVIEW_ONLY && ok) {
    record('Notecard preview', 'PASS', `Preview generated`);
    return data;
  }
  if (!ok) { record('Notecard', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`); return null; }

  record('Notecard', 'PASS', `Order ID: ${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}`);
  return data;
}

// ---------------------------------------------------------------------------
// 7. WINDOWLESS LETTER (PDF)
// ---------------------------------------------------------------------------
async function testWindowlessLetter() {
  if (!shouldRun('windowless')) return null;
  section('7. Windowless Letter (PDF)');

  const payload = {
    recipients: [RECIPIENT],
    message: MESSAGE,
    handwriting_style: 5,
    pdf_only_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    ...(PREVIEW_ONLY ? { preview: true } : {}),
  };

  const { status, ok, data } = await api('POST', '/send/windowlessletter', payload);

  if (PREVIEW_ONLY && ok) {
    record('Windowless Letter preview', 'PASS', `Preview generated`);
    return data;
  }
  if (!ok) { record('Windowless Letter', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`); return null; }

  record('Windowless Letter', 'PASS', `Order ID: ${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}`);
  return data;
}

// ---------------------------------------------------------------------------
// 8. GIFTCARD
// ---------------------------------------------------------------------------
async function testGiftcard() {
  if (!shouldRun('giftcard')) return null;
  section('8. Giftcard (Amazon $5)');

  const payload = {
    recipients: [RECIPIENT],
    message: MESSAGE,
    handwriting_style: 1,
    handwriting_color: 'blue',
    front_image_url: 'https://d2md0c8rpvzmz5.cloudfront.net/notecard-inspirations/note1.png',
    giftcard_brand: 'amazonus',
    giftcard_amount_in_cents: 500,
    ...(PREVIEW_ONLY ? { preview: true } : {}),
  };

  const { status, ok, data } = await api('POST', '/send/giftcard', payload);

  if (PREVIEW_ONLY && ok) {
    record('Giftcard preview', 'PASS', `Preview generated`);
    return data;
  }
  if (!ok) { record('Giftcard', 'FAIL', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`); return null; }

  record('Giftcard', 'PASS', `Order ID: ${data.id}, Status: ${data.status}, Cost: $${(data.authorization_total || 0) / 100}`);
  return data;
}

// ---------------------------------------------------------------------------
// 9. ERROR HANDLING & EDGE CASES
// ---------------------------------------------------------------------------
async function testErrorCases() {
  section('9. Error Handling & Edge Cases');

  // Missing recipients
  const { status: s1, data: d1 } = await api('POST', '/send/postcard', {
    message: 'test', handwriting_style: 1, size: '4x6',
  });
  record('Missing recipients', s1 >= 400 && s1 < 500 ? 'PASS' : 'FAIL', `Status: ${s1}`);

  // Invalid handwriting style
  const { status: s2, data: d2 } = await api('POST', '/send/postcard', {
    recipients: [RECIPIENT], message: 'test', handwriting_style: 99999, size: '4x6', preview: true,
  });
  record('Invalid handwriting style', 'INFO', `Status: ${s2} — ${JSON.stringify(d2).slice(0, 80)}`);

  // Empty message
  const { status: s3, data: d3 } = await api('POST', '/send/postcard', {
    recipients: [RECIPIENT], message: '', handwriting_style: 1, size: '4x6', preview: true,
  });
  record('Empty message', 'INFO', `Status: ${s3} — ${JSON.stringify(d3).slice(0, 80)}`);

  // Invalid auth
  const badRes = await fetch(`${BASE_URL}/send/postcard`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer invalid_key', 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ recipients: [RECIPIENT], message: 'test', size: '4x6' }),
  });
  record('Invalid API key', badRes.status === 401 ? 'PASS' : 'FAIL', `Status: ${badRes.status}`);

  // Very long message
  const longMsg = 'A'.repeat(5000);
  const { status: s5, data: d5 } = await api('POST', '/send/postcard', {
    recipients: [RECIPIENT], message: longMsg, handwriting_style: 1, size: '4x6', preview: true,
  });
  record('Very long message (5000 chars)', 'INFO', `Status: ${s5} — accepted: ${s5 === 200}`);

  // Multiple recipients
  const multiRecip = Array.from({ length: 3 }, (_, i) => ({
    ...RECIPIENT, name: `Test Recipient ${i + 1}`,
  }));
  const { status: s6, data: d6 } = await api('POST', '/send/postcard', {
    recipients: multiRecip, message: 'Multi-recipient test', handwriting_style: 1, size: '4x6',
    front_image_url: 'https://d2md0c8rpvzmz5.cloudfront.net/inspiration_templates/default10.png',
    preview: true,
  });
  record('Multiple recipients (3)', s6 === 200 ? 'PASS' : 'FAIL', `Status: ${s6}, recipients: ${d6.total_estimated_recipients || '?'}`);
}

// ---------------------------------------------------------------------------
// 10. GIFTCARD BRANDS CATALOG
// ---------------------------------------------------------------------------
async function testGiftcardBrands() {
  section('10. Giftcard Brands Catalog');

  const { status, ok, data } = await api('GET', '/giftcard-brands');
  if (!ok) { record('Giftcard brands', 'FAIL', `Status ${status}`); return; }

  const categories = Object.keys(data);
  let totalBrands = 0;
  categories.forEach(cat => { totalBrands += (data[cat]?.brands?.length || 0); });

  record('Giftcard catalog', 'PASS', `${categories.length} categories, ${totalBrands} total brands`);
  record('Categories', 'INFO', categories.join(', '));
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🚀 SteadyLetters — Comprehensive Thanks.io Product Test Suite');
  console.log(`   Mode: ${PREVIEW_ONLY ? 'PREVIEW ONLY (FREE)' : 'LIVE SEND (charges apply)'}`);
  if (SINGLE_PRODUCT) console.log(`   Filter: ${SINGLE_PRODUCT} only`);
  if (SKIP) console.log(`   Skipping: ${SKIP}`);
  if (!PREVIEW_ONLY) {
    console.log('\n⚠️  WARNING: Live sends will charge your Thanks.io account!');
    console.log('   Estimated cost: ~$15-20 for all products. Use --preview-only for free test.\n');
  }

  if (!API_KEY) {
    console.error('❌ THANKS_IO_API_KEY not set');
    process.exit(1);
  }

  const orders = [];

  // Run all tests
  const styles = await testHandwritingStyles();

  const pc4x6 = await testPostcard4x6();
  if (pc4x6?.id) orders.push({ type: 'Postcard 4x6', id: pc4x6.id, status: pc4x6.status });

  const pc6x9 = await testPostcard6x9();
  if (pc6x9?.id) orders.push({ type: 'Postcard 6x9', id: pc6x9.id, status: pc6x9.status });

  const pc6x11 = await testPostcard6x11();
  if (pc6x11?.id) orders.push({ type: 'Postcard 6x11', id: pc6x11.id, status: pc6x11.status });

  const letter = await testLetter();
  if (letter?.id) orders.push({ type: 'Letter', id: letter.id, status: letter.status });

  const notecard = await testNotecard();
  if (notecard?.id) orders.push({ type: 'Notecard', id: notecard.id, status: notecard.status });

  const windowless = await testWindowlessLetter();
  if (windowless?.id) orders.push({ type: 'Windowless Letter', id: windowless.id, status: windowless.status });

  const giftcard = await testGiftcard();
  if (giftcard?.id) orders.push({ type: 'Giftcard', id: giftcard.id, status: giftcard.status });

  await testErrorCases();
  await testGiftcardBrands();

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  section('SUMMARY');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const info = results.filter(r => r.status === 'INFO').length;

  console.log(`\n  Results: ${passed} passed, ${failed} failed, ${info} info`);

  if (orders.length > 0) {
    console.log(`\n  📦 Orders Created:`);
    let totalCost = 0;
    orders.forEach(o => {
      console.log(`     ${o.type}: Order #${o.id} (${o.status})`);
    });
    console.log(`\n  💰 Total orders: ${orders.length}`);
  }

  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    mode: PREVIEW_ONLY ? 'preview' : 'live',
    orders,
    results,
    apiKeyValid: true,
    stylesAvailable: styles?.length || 0,
  };

  const reportPath = resolve(__dirname, '../test-results/thanks-io-live-results.json');
  try {
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n  📄 Results saved to: test-results/thanks-io-live-results.json`);
  } catch {
    console.log(`\n  ⚠️  Could not save results file`);
  }

  if (failed > 0) {
    console.log('\n  ❌ Some tests FAILED — review output above');
    process.exit(1);
  } else {
    console.log('\n  ✅ All tests passed!');
  }
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err.message);
  process.exit(1);
});
