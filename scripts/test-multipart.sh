#!/bin/bash

# Test multipart form data submission with curl

echo "🧪 Testing multipart feedback submission with curl..."
echo ""

# Create a temporary file for the image
echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-screenshot.png

# Create JSON data in a temporary file
cat > /tmp/feedback-data.json << EOF
{
  "type": "bug",
  "title": "Test with Screenshot",
  "description": "This feedback includes a test screenshot.",
  "reporterEmail": "test@example.com",
  "reporterName": "Test User",
  "pageUrl": "https://test.example.com/screenshot-test",
  "userAgent": "curl/test",
  "browserInfo": {
    "browser": "curl",
    "version": "1.0",
    "os": "test"
  },
  "deviceInfo": {
    "type": "desktop",
    "os": "test",
    "screenResolution": "1920x1080"
  }
}
EOF

# Send multipart request
curl -X POST \
  "https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1/submit-feedback" \
  -H "X-Project-Key: proj_test123456789" \
  -H "Origin: http://localhost:5173" \
  -F "data=@/tmp/feedback-data.json;type=application/json" \
  -F "screenshot-0=@/tmp/test-screenshot.png;type=image/png" \
  -v

# Cleanup
rm -f /tmp/test-screenshot.png /tmp/feedback-data.json

echo ""
echo "✅ Test complete"