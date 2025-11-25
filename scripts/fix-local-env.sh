#!/bin/bash

# Fix Local Environment Script
# Copies .env to .env.local if it doesn't exist
# Next.js requires .env.local for development environment variables

echo "═══════════════════════════════════════════════════════════"
echo "🔧 FIXING LOCAL ENVIRONMENT"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "You need to create a .env file with your API keys."
    echo "See .env.example for required variables."
    exit 1
fi

echo "✅ Found .env file"

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Skipping copy."
        exit 0
    fi
fi

# Copy .env to .env.local
cp .env .env.local

if [ $? -eq 0 ]; then
    echo "✅ Created .env.local from .env"
    echo ""
    echo "Next.js will now load these environment variables in development."
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "  - .env.local is gitignored (your secrets are safe)"
    echo "  - Restart your dev server: npm run dev"
    echo ""
    echo "To verify:"
    echo "  npm run check:env"
    echo ""
    exit 0
else
    echo "❌ Failed to create .env.local"
    exit 1
fi
