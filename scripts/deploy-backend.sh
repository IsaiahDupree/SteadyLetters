#!/bin/bash

# Complete Backend Deployment Script
# Commits, pushes, and provides instructions for Vercel

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Backend Deployment Script${NC}"
echo ""

cd /Users/isaiahdupree/Documents/Software/KindLetters

# Step 1: Check git status
echo -e "${BLUE}=== Step 1: Git Status ===${NC}"
if git status --porcelain | grep -q "kindletters-backend"; then
    echo -e "${YELLOW}Backend directory has uncommitted changes${NC}"
    read -p "Commit and push? (y/n): " commit_confirm
    
    if [ "$commit_confirm" = "y" ]; then
        git add kindletters-backend/
        git commit -m "Add backend directory for Vercel deployment"
        echo -e "${GREEN}✅ Committed${NC}"
        
        read -p "Push to GitHub? (y/n): " push_confirm
        if [ "$push_confirm" = "y" ]; then
            git push origin main || git push origin backend
            echo -e "${GREEN}✅ Pushed to GitHub${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ Backend directory already committed${NC}"
fi

echo ""

# Step 2: Environment variables
echo -e "${BLUE}=== Step 2: Environment Variables ===${NC}"
echo -e "${YELLOW}⚠️  You need to add environment variables in Vercel Dashboard${NC}"
echo ""
echo "Go to: Vercel Dashboard → Backend Project → Settings → Environment Variables"
echo ""
echo "Required variables:"
echo "==================="
cat kindletters-backend/.env 2>/dev/null | grep -v "^#" | grep -v "^$" | awk -F'=' '{print "  - " $1}' || echo "  (Check kindletters-backend/.env file)"

echo ""
echo -e "${BLUE}Quick add via CLI:${NC}"
echo "cd kindletters-backend"
echo "vercel env add VARIABLE_NAME production,preview,development"
echo ""

# Step 3: Verify settings
echo -e "${BLUE}=== Step 3: Verify Vercel Settings ===${NC}"
echo "In Vercel Dashboard → Settings → General:"
echo "  ✅ Framework Preset: Other (NOT Next.js)"
echo "  ✅ Root Directory: kindletters-backend"
echo "  ✅ Build Command: npm install && npm run build"
echo "  ✅ Output Directory: dist"
echo ""

# Step 4: Deploy
echo -e "${BLUE}=== Step 4: Deploy ===${NC}"
echo "After adding environment variables:"
echo "  1. Vercel will auto-deploy on push (if already pushed)"
echo "  2. Or manually: Vercel Dashboard → Deployments → Redeploy"
echo ""

echo -e "${GREEN}✅ Deployment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Add environment variables in Vercel Dashboard"
echo "  2. Verify Framework Preset is 'Other'"
echo "  3. Deploy (automatic or manual)"
echo "  4. Test: https://your-backend.vercel.app/api/health"

