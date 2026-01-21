import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('CSV Import Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to login page and authenticate
        await page.goto('/login');
        await page.waitForURL('/login');

        // Login with test user
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('/dashboard', { timeout: 10000 });
    });

    test('should navigate to CSV import page', async ({ page }) => {
        // Go to recipients page
        await page.goto('/recipients');
        await expect(page).toHaveURL('/recipients');

        // Click import CSV button
        await page.click('text=Import CSV');

        // Should navigate to import page
        await expect(page).toHaveURL('/recipients/import');
        await expect(page.locator('h1')).toContainText('Import Recipients');
    });

    test('should download CSV template', async ({ page }) => {
        await page.goto('/recipients/import');

        // Set up download handler
        const downloadPromise = page.waitForEvent('download');

        // Click download template button
        await page.click('text=Download Template');

        // Wait for download to complete
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('recipients-template.csv');

        // Verify download content
        const filePath = path.join(__dirname, '../../downloads', download.suggestedFilename());
        await download.saveAs(filePath);

        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('name,address1,address2,city,state,zip,country');
        expect(content).toContain('John Doe');

        // Clean up
        fs.unlinkSync(filePath);
    });

    test('should upload and parse valid CSV', async ({ page }) => {
        await page.goto('/recipients/import');

        // Create a valid CSV file
        const csvContent = `name,address1,address2,city,state,zip,country
Test User 1,123 Main St,Apt 1,New York,NY,10001,US
Test User 2,456 Oak Ave,,Los Angeles,CA,90001,US`;

        const csvPath = path.join(__dirname, '../../tmp', 'test-recipients.csv');

        // Ensure tmp directory exists
        const tmpDir = path.dirname(csvPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(csvPath, csvContent);

        // Upload the file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(csvPath);

        // Wait for parsing to complete
        await page.waitForSelector('text=Total Rows', { timeout: 5000 });

        // Verify parse results
        await expect(page.locator('text=2').first()).toBeVisible(); // Total rows
        await expect(page.locator('text=Valid')).toBeVisible();

        // Clean up
        fs.unlinkSync(csvPath);
    });

    test('should show validation errors for invalid CSV', async ({ page }) => {
        await page.goto('/recipients/import');

        // Create a CSV with invalid data
        const csvContent = `name,address1,address2,city,state,zip,country
Valid User,123 Main St,,New York,NY,10001,US
,456 Oak Ave,,Los Angeles,CA,90001,US
Invalid ZIP User,789 Pine St,,Chicago,IL,invalid,US`;

        const csvPath = path.join(__dirname, '../../tmp', 'invalid-recipients.csv');

        // Ensure tmp directory exists
        const tmpDir = path.dirname(csvPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(csvPath, csvContent);

        // Upload the file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(csvPath);

        // Wait for parsing to complete
        await page.waitForSelector('text=Invalid Rows', { timeout: 5000 });

        // Verify error display
        await expect(page.locator('text=Invalid Rows')).toBeVisible();
        await expect(page.locator('text=Row 3')).toBeVisible(); // Row with empty name
        await expect(page.locator('text=Row 4')).toBeVisible(); // Row with invalid ZIP

        // Clean up
        fs.unlinkSync(csvPath);
    });

    test('should successfully import valid recipients', async ({ page }) => {
        await page.goto('/recipients/import');

        // Create a valid CSV file
        const timestamp = Date.now();
        const csvContent = `name,address1,address2,city,state,zip,country
CSV Test ${timestamp} 1,123 Main St,Apt 1,New York,NY,10001,US
CSV Test ${timestamp} 2,456 Oak Ave,,Los Angeles,CA,90001,US`;

        const csvPath = path.join(__dirname, '../../tmp', `test-import-${timestamp}.csv`);

        // Ensure tmp directory exists
        const tmpDir = path.dirname(csvPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(csvPath, csvContent);

        // Upload the file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(csvPath);

        // Wait for parsing to complete
        await page.waitForSelector('button:has-text("Import 2 Recipients")', { timeout: 5000 });

        // Click import button
        await page.click('button:has-text("Import 2 Recipients")');

        // Wait for success message
        await expect(page.locator('text=Successfully imported')).toBeVisible({ timeout: 10000 });

        // Should redirect to recipients page
        await page.waitForURL('/recipients', { timeout: 5000 });

        // Verify recipients appear in list
        await expect(page.locator(`text=CSV Test ${timestamp} 1`)).toBeVisible();
        await expect(page.locator(`text=CSV Test ${timestamp} 2`)).toBeVisible();

        // Clean up
        fs.unlinkSync(csvPath);
    });

    test('should reject CSV with missing required columns', async ({ page }) => {
        await page.goto('/recipients/import');

        // Create a CSV missing required columns
        const csvContent = `name,city,state,zip
Test User,New York,NY,10001`;

        const csvPath = path.join(__dirname, '../../tmp', 'missing-columns.csv');

        // Ensure tmp directory exists
        const tmpDir = path.dirname(csvPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(csvPath, csvContent);

        // Upload the file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(csvPath);

        // Wait for error message
        await expect(page.locator('text=Missing required columns')).toBeVisible({ timeout: 5000 });

        // Clean up
        fs.unlinkSync(csvPath);
    });

    test('should handle empty CSV file', async ({ page }) => {
        await page.goto('/recipients/import');

        // Create an empty CSV
        const csvContent = ``;

        const csvPath = path.join(__dirname, '../../tmp', 'empty.csv');

        // Ensure tmp directory exists
        const tmpDir = path.dirname(csvPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(csvPath, csvContent);

        // Upload the file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(csvPath);

        // Wait for error message
        await expect(page.locator('text=CSV must contain')).toBeVisible({ timeout: 5000 });

        // Clean up
        fs.unlinkSync(csvPath);
    });
});
