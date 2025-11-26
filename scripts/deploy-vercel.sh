#!/bin/bash

# Vercel Deployment Script
# Deploys both frontend and backend to Vercel

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Vercel Deployment Script${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${BLUE}=== Frontend Deployment ===${NC}"
echo "Deploying Next.js frontend..."
cd /Users/isaiahdupree/Documents/Software/KindLetters

# Check if already linked
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}Not linked to Vercel. Run 'vercel' first to link project.${NC}"
    echo "Or deploy manually from Vercel dashboard."
else
    echo -e "${GREEN}Project linked. Deploying...${NC}"
    vercel --prod
fi

echo ""
echo -e "${BLUE}=== Backend Deployment ===${NC}"
echo "Deploying Express.js backend..."
cd kindletters-backend

# Check if already linked
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}Not linked to Vercel. Run 'vercel' first to link project.${NC}"
    echo "Or deploy manually from Vercel dashboard."
    echo ""
    echo "To link backend:"
    echo "  cd kindletters-backend"
    echo "  vercel"
    echo "  # Select: Create new project"
    echo "  # Root directory: kindletters-backend"
else
    echo -e "${GREEN}Project linked. Deploying...${NC}"
    vercel --prod
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update frontend's NEXT_PUBLIC_BACKEND_URL with backend URL"
echo "2. Update backend's FRONTEND_URL with frontend URL"
echo "3. Configure Stripe webhook URL"
echo "4. Test the deployment"

