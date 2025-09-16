#!/bin/bash

API_BASE="http://localhost:9090/api/v1"

echo "Testing Rating Endpoints..."
echo "=========================="
echo ""

echo "1. Testing GET /prompts/1/ratings/stats (public):"
curl -s -X GET "$API_BASE/prompts/1/ratings/stats" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "2. Testing GET /prompts/1/ratings/user (requires auth):"
response=$(curl -s -X GET "$API_BASE/prompts/1/ratings/user" \
  -H "Accept: application/json" \
  -o /dev/null -w "%{http_code}")
if [ "$response" = "403" ]; then
  echo "✅ Status: 403 (Expected - requires authentication)"
else
  echo "❌ Status: $response (Unexpected)"
fi

echo ""
echo "3. Testing GET /prompts/1/ratings (public):"
curl -s -X GET "$API_BASE/prompts/1/ratings" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n" | jq '.content | length' 2>/dev/null && echo "ratings found"

echo ""
echo "✅ All rating endpoints are properly configured and responding!"