#!/bin/bash

# Environment Setup Script
# This script helps set up environment variables for local development

set -e

echo "🔧 Setting up environment variables..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend .env
BACKEND_ENV="kindletters-backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > "$BACKEND_ENV" << 'EOF'
# Backend Environment Variables
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=your_postgres_connection_string

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe (optional for basic testing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxx

# Application URLs
NEXT_PUBLIC_URL=http://localhost:3000

# Thanks.io (optional)
THANKS_IO_API_KEY=your_thanks_io_key
EOF
    echo -e "${GREEN}✅ Created $BACKEND_ENV${NC}"
    echo -e "${YELLOW}⚠️  Please edit $BACKEND_ENV and fill in your actual values${NC}"
else
    echo -e "${GREEN}✅ Backend .env already exists${NC}"
fi

# Frontend .env.local
FRONTEND_ENV=".env.local"
if [ ! -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}Creating frontend .env.local file...${NC}"
    cat > "$FRONTEND_ENV" << 'EOF'
# Frontend Environment Variables
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_xxxxx
EOF
    echo -e "${GREEN}✅ Created $FRONTEND_ENV${NC}"
    echo -e "${YELLOW}⚠️  Please edit $FRONTEND_ENV and fill in your actual values${NC}"
else
    echo -e "${GREEN}✅ Frontend .env.local already exists${NC}"
fi

echo ""
echo -e "${GREEN}✅ Environment files created!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit kindletters-backend/.env and add your actual values"
echo "2. Edit .env.local and add your actual values"
echo "3. Restart both servers after updating environment variables"
echo ""
echo "See ENVIRONMENT_SETUP.md for detailed instructions."

