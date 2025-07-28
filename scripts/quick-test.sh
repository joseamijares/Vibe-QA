#!/bin/bash

# Quick test script to verify setup before deployment

echo "🧪 VibeQA Quick Test"
echo "==================="
echo ""

# Check environment
echo "1️⃣ Checking environment..."
if [ -f .env ]; then
    echo "✅ .env file found"
    
    # Check for required vars
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo "✅ VITE_SUPABASE_URL configured"
        SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
        echo "   URL: $SUPABASE_URL"
    else
        echo "❌ VITE_SUPABASE_URL not found in .env"
    fi
    
    if grep -q "BREVO_API_KEY" .env; then
        echo "✅ BREVO_API_KEY configured"
    else
        echo "⚠️  BREVO_API_KEY not found (email notifications won't work)"
    fi
else
    echo "❌ No .env file found"
    exit 1
fi

echo ""
echo "2️⃣ Checking database setup..."

# Extract Supabase URL
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

# Check if we can query the test project (this will fail if tables don't exist)
echo "   Checking for test project in database..."
TEST_PROJECT_CHECK=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/projects?api_key=eq.proj_test123456789" \
  -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")" \
  -H "Content-Type: application/json" 2>&1)

if echo "$TEST_PROJECT_CHECK" | grep -q "relation.*does not exist"; then
    echo "❌ Database tables not found!"
    echo "   Run the setup script in Supabase SQL Editor:"
    echo "   scripts/setup-database.sql"
    echo ""
    echo "   See docs/database-setup.md for instructions"
    exit 1
elif echo "$TEST_PROJECT_CHECK" | grep -q "proj_test123456789"; then
    echo "✅ Test project found in database"
else
    echo "⚠️  Test project not found. You may need to run setup-database.sql"
fi

echo ""
echo "3️⃣ Testing API endpoint..."

API_URL="${SUPABASE_URL}/functions/v1/submit-feedback"

echo "   Testing: $API_URL"

# Test with curl
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Project-Key: proj_test123456789" \
  -d '{
    "type": "bug",
    "description": "Quick test from script",
    "pageUrl": "https://test.example.com"
  }' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API endpoint is responding correctly"
    echo "   Response: $BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Function not found. Deploy with: ./scripts/deploy-feedback-function.sh"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Authentication error. Check project setup in database"
else
    echo "❌ API test failed with HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi

echo ""
echo "4️⃣ Checking widget files..."

if [ -f "src/widget/VibeQAWidget.ts" ]; then
    echo "✅ Widget source files found"
else
    echo "❌ Widget source files not found"
fi

if [ -f "dist-widget/widget.iife.js" ]; then
    echo "✅ Widget production build found"
    SIZE=$(ls -lh dist-widget/widget.iife.js | awk '{print $5}')
    echo "   Size: $SIZE"
else
    echo "⚠️  No production build. Run: npm run build:widget"
fi

echo ""
echo "📋 Summary"
echo "=========="
echo ""
echo "Next steps:"

if [ "$HTTP_CODE" != "200" ]; then
    echo "1. Deploy Edge Functions: ./scripts/deploy-feedback-function.sh"
    echo "2. Set up test project in database (see scripts/setup-test-project.sql)"
fi

echo "3. Test locally: npm run dev → open http://localhost:5173/widget-demo.html"
echo "4. Build for production: npm run build:widget"
echo "5. Deploy to CDN (see docs/widget/deployment-guide.md)"
echo ""