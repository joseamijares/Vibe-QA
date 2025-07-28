#!/bin/bash

# Direct test of Edge Function

echo "Testing Edge Function directly..."

# Load environment variables
source .env

# Test with curl
curl -X POST \
  "https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1/submit-feedback" \
  -H "Content-Type: application/json" \
  -H "X-Project-Key: proj_test123456789" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -d '{
    "type": "bug",
    "description": "Direct test from curl",
    "pageUrl": "https://test.example.com",
    "browserInfo": {
      "browser": "curl",
      "version": "test",
      "os": "test"
    },
    "deviceInfo": {
      "type": "desktop",
      "os": "test",
      "screenResolution": "test"
    }
  }' | jq '.'