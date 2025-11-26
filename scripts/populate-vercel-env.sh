#!/bin/bash

# Script to populate Vercel environment variables
# This script helps you add all required environment variables to Vercel

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Vercel Environment Variables Setup${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please login:${NC}"
    vercel login
fi

echo -e "${BLUE}Which project are you setting up?${NC}"
echo "1) Frontend (Next.js)"
echo "2) Backend (Express.js)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    PROJECT_TYPE="frontend"
    PROJECT_DIR="/Users/isaiahdupree/Documents/Software/KindLetters"
    ENV_FILE=".env.local"
else
    PROJECT_TYPE="backend"
    PROJECT_DIR="/Users/isaiahdupree/Documents/Software/KindLetters/kindletters-backend"
    ENV_FILE=".env"
fi

cd "$PROJECT_DIR"

echo ""
echo -e "${BLUE}Reading environment variables from ${ENV_FILE}...${NC}"

# Read .env file and extract variables
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ ${ENV_FILE} not found!${NC}"
    echo "Please create it first with your environment variables."
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  This script will help you add environment variables to Vercel.${NC}"
echo -e "${YELLOW}⚠️  You'll need to paste values manually for security.${NC}"
echo ""

# Function to add env var
add_env_var() {
    local var_name=$1
    local var_value=$2
    local environments=$3
    
    echo -e "${BLUE}Adding: ${var_name}${NC}"
    echo "Value: ${var_value:0:20}..." # Show first 20 chars
    
    if vercel env add "$var_name" "$environments" <<< "$var_value" 2>/dev/null; then
        echo -e "${GREEN}✅ Added ${var_name}${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to add ${var_name} automatically${NC}"
        echo "   Please add manually: vercel env add $var_name $environments"
    fi
    echo ""
}

# Read and process .env file
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Skip if value is empty
    [[ -z "$value" ]] && continue
    
    echo -e "${BLUE}Found: ${key}${NC}"
    read -p "Add to Vercel? (y/n): " confirm
    
    if [ "$confirm" = "y" ]; then
        read -p "Environments (production,preview,development): " envs
        envs=${envs:-production,preview,development}
        
        echo "Adding ${key}..."
        vercel env add "$key" "$envs" <<< "$value" || echo "Failed - add manually"
        echo ""
    fi
done < "$ENV_FILE"

echo ""
echo -e "${GREEN}✅ Environment variables setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify all variables in Vercel Dashboard"
echo "2. Redeploy your project"
echo "3. Test the deployment"

