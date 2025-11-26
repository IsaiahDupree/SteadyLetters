#!/bin/bash

# Comprehensive Test Runner for Frontend and Backend
# Runs all available tests and reports results

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running All Tests - Frontend & Backend${NC}"
echo ""

# Track results
FRONTEND_PASSED=0
FRONTEND_FAILED=0
BACKEND_PASSED=0
BACKEND_FAILED=0

# Check if servers are running
echo -e "${BLUE}=== Checking Server Status ===${NC}"
BACKEND_RUNNING=$(curl -s http://localhost:3001/api/health > /dev/null 2>&1 && echo "yes" || echo "no")
FRONTEND_RUNNING=$(curl -s http://localhost:3000 > /dev/null 2>&1 && echo "yes" || echo "no")

if [ "$BACKEND_RUNNING" = "no" ]; then
    echo -e "${YELLOW}⚠️  Backend not running on port 3001${NC}"
    echo -e "${YELLOW}   Some tests may fail. Start with: cd kindletters-backend && npm run dev${NC}"
fi

if [ "$FRONTEND_RUNNING" = "no" ]; then
    echo -e "${YELLOW}⚠️  Frontend not running on port 3000${NC}"
    echo -e "${YELLOW}   Some tests may fail. Start with: npm run dev${NC}"
fi

echo ""

# Frontend Tests
echo -e "${BLUE}=== Frontend Tests ===${NC}"
echo ""

# 1. Jest Unit Tests
echo -e "${BLUE}1. Running Jest Unit Tests...${NC}"
cd /Users/isaiahdupree/Documents/Software/KindLetters
if npm test 2>&1 | tee /tmp/jest-tests.log; then
    echo -e "${GREEN}✅ Jest tests passed${NC}"
    FRONTEND_PASSED=$((FRONTEND_PASSED + 1))
else
    echo -e "${RED}❌ Jest tests failed${NC}"
    FRONTEND_FAILED=$((FRONTEND_FAILED + 1))
fi
echo ""

# 2. Integration Tests (API Health Check)
echo -e "${BLUE}2. Running Integration Tests...${NC}"
if npm run test:integration 2>&1 | tee /tmp/integration-tests.log; then
    echo -e "${GREEN}✅ Integration tests passed${NC}"
    FRONTEND_PASSED=$((FRONTEND_PASSED + 1))
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    FRONTEND_FAILED=$((FRONTEND_FAILED + 1))
fi
echo ""

# 3. API Endpoint Tests
echo -e "${BLUE}3. Running API Endpoint Tests...${NC}"
if ./scripts/test-api-endpoints.sh 2>&1 | tee /tmp/api-endpoint-tests.log; then
    echo -e "${GREEN}✅ API endpoint tests passed${NC}"
    FRONTEND_PASSED=$((FRONTEND_PASSED + 1))
else
    echo -e "${RED}❌ API endpoint tests failed${NC}"
    FRONTEND_FAILED=$((FRONTEND_FAILED + 1))
fi
echo ""

# 4. Playwright E2E Tests (if servers are running)
if [ "$FRONTEND_RUNNING" = "yes" ] && [ "$BACKEND_RUNNING" = "yes" ]; then
    echo -e "${BLUE}4. Running Playwright E2E Tests...${NC}"
    echo -e "${YELLOW}   (This may take a while)${NC}"
    if npm run test:e2e:local 2>&1 | tee /tmp/e2e-tests.log; then
        echo -e "${GREEN}✅ E2E tests passed${NC}"
        FRONTEND_PASSED=$((FRONTEND_PASSED + 1))
    else
        echo -e "${RED}❌ E2E tests failed${NC}"
        FRONTEND_FAILED=$((FRONTEND_FAILED + 1))
    fi
    echo ""
else
    echo -e "${YELLOW}4. Skipping E2E tests (servers not running)${NC}"
    echo ""
fi

# Backend Tests
echo -e "${BLUE}=== Backend Tests ===${NC}"
echo ""

# Backend doesn't have tests yet, but we can test the API
echo -e "${BLUE}1. Testing Backend API Endpoints...${NC}"
cd /Users/isaiahdupree/Documents/Software/KindLetters
if ./scripts/test-api-endpoints.sh 2>&1 | grep -q "All endpoint tests passed"; then
    echo -e "${GREEN}✅ Backend API tests passed${NC}"
    BACKEND_PASSED=$((BACKEND_PASSED + 1))
else
    echo -e "${RED}❌ Backend API tests failed${NC}"
    BACKEND_FAILED=$((BACKEND_FAILED + 1))
fi
echo ""

# Summary
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""
echo -e "${BLUE}Frontend Tests:${NC}"
echo -e "   ${GREEN}✅ Passed: $FRONTEND_PASSED${NC}"
echo -e "   ${RED}❌ Failed: $FRONTEND_FAILED${NC}"
echo ""
echo -e "${BLUE}Backend Tests:${NC}"
echo -e "   ${GREEN}✅ Passed: $BACKEND_PASSED${NC}"
echo -e "   ${RED}❌ Failed: $BACKEND_FAILED${NC}"
echo ""
echo -e "${BLUE}==================================================${NC}"

TOTAL_PASSED=$((FRONTEND_PASSED + BACKEND_PASSED))
TOTAL_FAILED=$((FRONTEND_FAILED + BACKEND_FAILED))

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check logs above.${NC}"
    echo ""
    echo "Log files:"
    echo "  - Jest: /tmp/jest-tests.log"
    echo "  - Integration: /tmp/integration-tests.log"
    echo "  - API Endpoints: /tmp/api-endpoint-tests.log"
    if [ "$FRONTEND_RUNNING" = "yes" ] && [ "$BACKEND_RUNNING" = "yes" ]; then
        echo "  - E2E: /tmp/e2e-tests.log"
    fi
    exit 1
fi

