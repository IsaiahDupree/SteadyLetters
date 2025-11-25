/**
 * Script to create sample letter images for testing
 * 
 * This script generates PNG images with letter content and return addresses
 * that can be used for testing the address extraction feature.
 * 
 * Usage: node tests/fixtures/create-letter-images.mjs
 */

import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LETTER_EXAMPLES } from './letter-examples.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'letter-images');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create a letter image with return address
 */
function createLetterImage(example, outputPath) {
    const width = 1200;
    const height = 1600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw return address in top-left (typical position)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    
    const returnAddr = example.returnAddress;
    const returnAddrLines = [
        returnAddr.name,
        returnAddr.address1,
        returnAddr.address2,
        `${returnAddr.city}, ${returnAddr.state} ${returnAddr.zip}`,
    ].filter(Boolean);

    let y = 100;
    returnAddrLines.forEach(line => {
        ctx.fillText(line, 100, y);
        y += 25;
    });

    // Draw letter content
    ctx.font = '14px Arial';
    y = 300;
    const letterLines = (example.letterContent || '').split('\n');
    letterLines.forEach(line => {
        ctx.fillText(line, 100, y);
        y += 20;
    });

    // Save image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Created: ${outputPath}`);
}

/**
 * Generate all letter images
 */
function generateAllLetterImages() {
    console.log('Generating letter images for testing...\n');

    LETTER_EXAMPLES.forEach(example => {
        const outputPath = path.join(OUTPUT_DIR, `${example.id}.png`);
        try {
            createLetterImage(example, outputPath);
        } catch (error) {
            console.error(`Error creating ${example.id}:`, error.message);
        }
    });

    console.log(`\n✅ Generated ${LETTER_EXAMPLES.length} letter images in ${OUTPUT_DIR}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generateAllLetterImages();
}

export { createLetterImage, generateAllLetterImages };

