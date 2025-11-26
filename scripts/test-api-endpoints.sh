#!/bin/bash

# API Endpoint Testing Script
# Tests all migrated API endpoints

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing API Endpoints${NC}"
echo -e "${BLUE}Backend: $BACKEND_URL${NC}"
echo -e "${BLUE}Frontend: $FRONTEND_URL${NC}"
echo ""

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "${BLUE}Testing: $name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" 2>/dev/null || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BACKEND_URL$endpoint" 2>/dev/null || echo -e "\n000")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}  ✅ $name: OK ($http_code)${NC}"
        PASSED=$((PASSED + 1))
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        echo -e "${YELLOW}  ⚠️  $name: Auth required ($http_code) - Expected${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}  ❌ $name: Failed ($http_code)${NC}"
        if [ -n "$body" ]; then
            echo "     Response: $(echo "$body" | head -c 100)"
        fi
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# Public endpoints (should work without auth)
echo -e "${BLUE}=== Public Endpoints ===${NC}"
test_endpoint "Health Check" "GET" "/api/health"
test_endpoint "Handwriting Styles" "GET" "/api/handwriting-styles"

# Protected endpoints (will return 401 - that's expected)
echo -e "${BLUE}=== Protected Endpoints (Expected: 401) ===${NC}"
test_endpoint "Letter Generation" "POST" "/api/generate/letter" '{"context":"test","tone":"warm","occasion":"general"}'
test_endpoint "Billing Usage" "GET" "/api/billing/usage"
test_endpoint "Orders" "GET" "/api/orders"
test_endpoint "Thanks.io Products" "GET" "/api/thanks-io/products"

# Summary
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}📊 Test Results:${NC}"
echo -e "${BLUE}   Total: $((PASSED + FAILED))${NC}"
echo -e "${GREEN}   ✅ Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}   ❌ Failed: $FAILED${NC}"
else
    echo -e "${GREEN}   ❌ Failed: $FAILED${NC}"
fi
echo -e "${BLUE}==================================================${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All endpoint tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi

