#!/bin/bash

# Check if test project exists in database

echo "🔍 Checking for test project in database..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^VITE_SUPABASE' | xargs)
fi

# Query for test project
curl -s -X GET \
  "${VITE_SUPABASE_URL}/rest/v1/projects?api_key=eq.proj_test123456789&select=*" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" | jq '.'

echo ""
echo "If you see an empty array [], run this SQL in Supabase Dashboard:"
echo "SELECT * FROM projects WHERE api_key = 'proj_test123456789';"