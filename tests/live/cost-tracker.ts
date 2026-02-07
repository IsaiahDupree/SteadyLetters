import fs from 'fs';
import path from 'path';

interface OrderRecord {
  testId: string;
  orderId: string;
  type: string;
  cost: number;
  recipient: string;
  timestamp: string;
}

interface TestRunReport {
  runId: string;
  profile: string;
  totalSpent: number;
  maxSpend: number;
  tests: { passed: number; failed: number; skipped: number };
  orders: OrderRecord[];
  timestamp: string;
}

export class CostTracker {
  private totalSpent = 0;
  private maxSpend: number;
  private orders: OrderRecord[] = [];
  private runId: string;
  private profile: string;
  private testCounts = { passed: 0, failed: 0, skipped: 0 };

  constructor(maxSpend: number, profile: string) {
    this.maxSpend = maxSpend;
    this.profile = profile;
    this.runId = `live-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  }

  canSpend(amount: number): boolean {
    return (this.totalSpent + amount) <= this.maxSpend;
  }

  assertCanSpend(amount: number, description: string): void {
    if (!this.canSpend(amount)) {
      throw new Error(
        `💰 BUDGET EXCEEDED — Cannot spend $${amount.toFixed(2)} on "${description}"\n` +
        `   Current spend: $${this.totalSpent.toFixed(2)} / $${this.maxSpend.toFixed(2)} max\n` +
        `   Remaining: $${(this.maxSpend - this.totalSpent).toFixed(2)}`
      );
    }
  }

  recordSpend(testId: string, orderId: string, type: string, cost: number, recipient: string): void {
    this.totalSpent += cost;
    this.orders.push({
      testId,
      orderId,
      type,
      cost,
      recipient,
      timestamp: new Date().toISOString(),
    });
    console.log(`   ✅ Order ${orderId} — $${cost.toFixed(2)} (running total: $${this.totalSpent.toFixed(2)})`);
  }

  recordTestResult(result: 'passed' | 'failed' | 'skipped'): void {
    this.testCounts[result]++;
  }

  getTotalSpent(): number {
    return this.totalSpent;
  }

  getReport(): TestRunReport {
    return {
      runId: this.runId,
      profile: this.profile,
      totalSpent: this.totalSpent,
      maxSpend: this.maxSpend,
      tests: { ...this.testCounts },
      orders: [...this.orders],
      timestamp: new Date().toISOString(),
    };
  }

  saveReport(): string {
    const report = this.getReport();
    const reportsDir = path.join(process.cwd(), 'tests', 'live', 'reports');

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `${this.runId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    return reportPath;
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 LIVE TEST RUN SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Run ID:    ${this.runId}`);
    console.log(`   Profile:   ${this.profile}`);
    console.log(`   Passed:    ${this.testCounts.passed}`);
    console.log(`   Failed:    ${this.testCounts.failed}`);
    console.log(`   Skipped:   ${this.testCounts.skipped}`);
    console.log(`   💰 Total:  $${this.totalSpent.toFixed(2)} / $${this.maxSpend.toFixed(2)} max`);
    if (this.orders.length > 0) {
      console.log('   📬 Orders:');
      for (const order of this.orders) {
        console.log(`      ${order.testId} → ${order.type} → ${order.orderId} ($${order.cost.toFixed(2)})`);
      }
    }
    console.log('='.repeat(60) + '\n');
  }
}
