#!/bin/bash

# Validation Script for Multi-Page Scoring
# Tests if audit scores change when analyzing different numbers of pages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Multi-Page Scoring Validation${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test site - using wordpress.org as example
TEST_SITE="${1:-https://wordpress.org}"
REPORTS_DIR="./reports/validation"

echo -e "${YELLOW}Test Site: ${TEST_SITE}${NC}\n"

# Create validation reports directory
mkdir -p "$REPORTS_DIR"

# Test 1: Single page (homepage only)
echo -e "${GREEN}==> Test 1: Auditing homepage only${NC}"
npm run dev -- \
  --url "$TEST_SITE" \
  --pages "/" \
  --out "$REPORTS_DIR/test-1-homepage.md" \
  --verbose

echo -e "\n"

# Test 2: Multiple pages (3 pages)
echo -e "${GREEN}==> Test 2: Auditing 3 pages${NC}"
npm run dev -- \
  --url "$TEST_SITE" \
  --pages "/" "/about/" "/contact/" \
  --out "$REPORTS_DIR/test-2-three-pages.md" \
  --verbose

echo -e "\n"

# Test 3: More pages (5 pages)
echo -e "${GREEN}==> Test 3: Auditing 5 pages${NC}"
npm run dev -- \
  --url "$TEST_SITE" \
  --pages "/" "/about/" "/contact/" "/blog/" "/support/" \
  --out "$REPORTS_DIR/test-3-five-pages.md" \
  --verbose

echo -e "\n"

# Test 4: Auto-discovery with max pages
echo -e "${GREEN}==> Test 4: Auto-discovery (max 10 pages)${NC}"
npm run dev -- \
  --url "$TEST_SITE" \
  --auto-pages \
  --max-pages 10 \
  --out "$REPORTS_DIR/test-4-auto-10-pages.md" \
  --verbose

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Reports saved to: ${REPORTS_DIR}${NC}\n"

echo -e "Compare results:"
echo -e "  - Test 1: 1 page (homepage)"
echo -e "  - Test 2: 3 pages"
echo -e "  - Test 3: 5 pages"
echo -e "  - Test 4: Auto-discovered pages (max 10)\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Check scores in each report"
echo -e "2. Verify scores change as expected"
echo -e "3. Confirm weighted SEO scoring (homepage 2x weight)"
echo -e "4. Validate performance averaging across pages\n"
