#!/bin/bash

# Quick script to add backend environment variables to Vercel
# Reads from kindletters-backend/.env and adds to Vercel

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Adding Backend Environment Variables to Vercel${NC}"
echo ""

cd /Users/isaiahdupree/Documents/Software/KindLetters/kindletters-backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo -e "${BLUE}Reading environment variables...${NC}"
echo ""

# Read .env and create list
ENV_VARS=()
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | xargs)
    
    [[ -z "$key" ]] && continue
    [[ -z "$value" ]] && continue
    
    ENV_VARS+=("$key=$value")
done < .env

echo -e "${GREEN}Found ${#ENV_VARS[@]} environment variables${NC}"
echo ""
echo -e "${YELLOW}⚠️  You'll need to add these manually in Vercel Dashboard${NC}"
echo -e "${YELLOW}   Or use: vercel env add VARIABLE_NAME production,preview,development${NC}"
echo ""
echo "Variables to add:"
echo "=================="

for var in "${ENV_VARS[@]}"; do
    key=$(echo "$var" | cut -d'=' -f1)
    value=$(echo "$var" | cut -d'=' -f2-)
    # Show first 30 chars of value
    value_preview="${value:0:30}..."
    echo "  ${key}=${value_preview}"
done

echo ""
echo -e "${BLUE}Quick add commands:${NC}"
echo ""
echo "cd kindletters-backend"
for var in "${ENV_VARS[@]}"; do
    key=$(echo "$var" | cut -d'=' -f1)
    echo "vercel env add $key production,preview,development"
done

echo ""
echo -e "${GREEN}✅ Environment variables list generated!${NC}"

