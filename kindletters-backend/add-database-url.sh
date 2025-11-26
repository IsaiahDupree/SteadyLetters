#!/bin/bash

# Script to add DATABASE_URL to Vercel via CLI

echo "=== Add DATABASE_URL to Vercel ==="
echo ""
echo "This will add DATABASE_URL to the steadylettersbackend project."
echo ""

# Prompt for connection string
echo "Enter your production Supabase DATABASE_URL:"
echo "Format: postgres://postgres.jibnaxhixzbuizscucbs:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
echo ""
read -p "DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL cannot be empty!"
    exit 1
fi

echo ""
echo "Adding DATABASE_URL to Vercel..."
echo ""

# Add to all environments
echo "$DATABASE_URL" | vercel env add DATABASE_URL production,preview,development

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DATABASE_URL added successfully!"
    echo ""
    echo "Verifying..."
    vercel env ls
    echo ""
    echo "✅ Done! You can now redeploy your project."
else
    echo ""
    echo "❌ Failed to add DATABASE_URL. Please check the error above."
    exit 1
fi

