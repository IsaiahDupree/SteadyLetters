#!/usr/bin/env ts-node
/**
 * SteadyLetters iOS Feature Verification Harness
 *
 * This script reads feature_list.json and provides a summary of feature
 * completion status. It can also be used by autonomous agents to update
 * feature pass/fail status after verification.
 *
 * Usage:
 *   npx ts-node scripts/verify-features.ts                  # Show summary
 *   npx ts-node scripts/verify-features.ts --category auth  # Show auth features
 *   npx ts-node scripts/verify-features.ts --failing         # Show failing features
 *   npx ts-node scripts/verify-features.ts --passing         # Show passing features
 *   npx ts-node scripts/verify-features.ts --set IOS-AUTH-001 true  # Mark feature as passing
 */

import * as fs from 'fs';
import * as path from 'path';

interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  file: string;
  passes: boolean;
}

interface FeatureList {
  project: string;
  platform: string;
  framework: string;
  version: string;
  total_features: number;
  categories: string[];
  features: Feature[];
}

const FEATURE_LIST_PATH = path.resolve(__dirname, '..', 'feature_list.json');

function loadFeatures(): FeatureList {
  const raw = fs.readFileSync(FEATURE_LIST_PATH, 'utf-8');
  return JSON.parse(raw) as FeatureList;
}

function saveFeatures(data: FeatureList): void {
  fs.writeFileSync(FEATURE_LIST_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function printSummary(data: FeatureList): void {
  const total = data.features.length;
  const passing = data.features.filter(f => f.passes).length;
  const failing = total - passing;
  const pct = ((passing / total) * 100).toFixed(1);

  console.log('');
  console.log('='.repeat(60));
  console.log(`  ${data.project} - Feature Status`);
  console.log('='.repeat(60));
  console.log(`  Total:   ${total}`);
  console.log(`  Passing: ${passing} (${pct}%)`);
  console.log(`  Failing: ${failing}`);
  console.log('='.repeat(60));
  console.log('');

  // Category breakdown
  const categories = new Map<string, { total: number; passing: number }>();
  for (const f of data.features) {
    const cat = categories.get(f.category) || { total: 0, passing: 0 };
    cat.total++;
    if (f.passes) cat.passing++;
    categories.set(f.category, cat);
  }

  console.log('  Category Breakdown:');
  console.log('  ' + '-'.repeat(56));
  console.log(`  ${'Category'.padEnd(20)} ${'Pass'.padStart(6)} ${'Total'.padStart(6)} ${'%'.padStart(8)}`);
  console.log('  ' + '-'.repeat(56));

  for (const [cat, stats] of categories) {
    const catPct = ((stats.passing / stats.total) * 100).toFixed(0);
    const bar = stats.passing === stats.total ? ' [DONE]' : '';
    console.log(
      `  ${cat.padEnd(20)} ${String(stats.passing).padStart(6)} ${String(stats.total).padStart(6)} ${(catPct + '%').padStart(7)}${bar}`
    );
  }
  console.log('  ' + '-'.repeat(56));
  console.log('');
}

function printFeatures(features: Feature[], label: string): void {
  console.log(`\n  ${label} (${features.length}):`);
  console.log('  ' + '-'.repeat(76));
  for (const f of features) {
    const status = f.passes ? 'PASS' : 'FAIL';
    const icon = f.passes ? '+' : '-';
    console.log(`  [${icon}] ${f.id.padEnd(18)} ${f.name.substring(0, 40).padEnd(42)} ${status}`);
  }
  console.log('');
}

function main(): void {
  const args = process.argv.slice(2);
  const data = loadFeatures();

  if (args.includes('--set') && args.length >= 3) {
    const setIdx = args.indexOf('--set');
    const featureId = args[setIdx + 1];
    const value = args[setIdx + 2] === 'true';
    const feature = data.features.find(f => f.id === featureId);
    if (!feature) {
      console.error(`Feature not found: ${featureId}`);
      process.exit(1);
    }
    feature.passes = value;
    data.total_features = data.features.length;
    saveFeatures(data);
    console.log(`  Updated ${featureId}: passes = ${value}`);
    printSummary(data);
    return;
  }

  if (args.includes('--category')) {
    const catIdx = args.indexOf('--category');
    const category = args[catIdx + 1];
    const filtered = data.features.filter(f => f.category === category);
    if (filtered.length === 0) {
      console.error(`No features found for category: ${category}`);
      console.log(`  Available categories: ${data.categories.join(', ')}`);
      process.exit(1);
    }
    printFeatures(filtered, `Category: ${category}`);
    return;
  }

  if (args.includes('--failing')) {
    const failing = data.features.filter(f => !f.passes);
    printFeatures(failing, 'Failing Features');
    return;
  }

  if (args.includes('--passing')) {
    const passing = data.features.filter(f => f.passes);
    printFeatures(passing, 'Passing Features');
    return;
  }

  // Default: show summary
  printSummary(data);
}

main();
