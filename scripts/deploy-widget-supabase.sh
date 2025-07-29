#!/bin/bash

# Deploy VibeQA Widget to Supabase Storage
# Usage: ./scripts/deploy-widget-supabase.sh [channel]
# Channel: production (default), staging, or beta

set -e

# Configuration
CHANNEL=${1:-production}
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID:-""}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-""}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying VibeQA Widget to Supabase Storage (${CHANNEL})${NC}"

# Check environment variables
if [ -z "$SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Missing required environment variables${NC}"
    echo "Please set:"
    echo "  export SUPABASE_PROJECT_ID=your-project-id"
    echo "  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}📦 Building widget version ${VERSION}${NC}"

# Build the widget
echo "Building production widget..."
npm run build:widget

# Check if build was successful
if [ ! -f "dist-widget/widget.js" ]; then
    echo -e "${RED}❌ Build failed: widget.js not found${NC}"
    exit 1
fi

# Get file size and calculate checksum
FILESIZE=$(wc -c < dist-widget/widget.js)
CHECKSUM=$(shasum -a 256 dist-widget/widget.js | awk '{print $1}')
echo -e "${GREEN}✓ Widget built successfully (${FILESIZE} bytes)${NC}"
echo -e "${GREEN}✓ Checksum: ${CHECKSUM:0:16}...${NC}"

# Prepare upload paths
VERSIONED_PATH="v${VERSION}/widget.js"
CHANNEL_PATH="${CHANNEL}/widget.js"
LATEST_PATH="latest/widget.js"

# Supabase Storage API URL
STORAGE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/widget-assets"

# Function to upload file to Supabase Storage
upload_to_supabase() {
    local path=$1
    local cache_control=$2
    
    echo "Uploading to ${path}..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        "${STORAGE_URL}/${path}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/javascript" \
        -H "Cache-Control: ${cache_control}" \
        --data-binary "@dist-widget/widget.js")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ Uploaded successfully${NC}"
    else
        echo -e "${RED}✗ Upload failed (HTTP ${http_code})${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Upload versioned file (immutable)
echo -e "\n${YELLOW}📤 Uploading versioned widget...${NC}"
upload_to_supabase "$VERSIONED_PATH" "public, max-age=31536000, immutable"

# Upload to channel (short cache)
echo -e "\n${YELLOW}📤 Uploading to ${CHANNEL} channel...${NC}"
upload_to_supabase "$CHANNEL_PATH" "public, max-age=300"

# If production, also update latest
if [ "$CHANNEL" = "production" ]; then
    echo -e "\n${YELLOW}📤 Updating latest...${NC}"
    upload_to_supabase "$LATEST_PATH" "public, max-age=300"
fi

# Create version manifest
echo -e "\n${YELLOW}📝 Creating version manifest...${NC}"
cat > dist-widget/version.json <<EOF
{
  "version": "${VERSION}",
  "channel": "${CHANNEL}",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "fileSize": ${FILESIZE},
  "checksum": "${CHECKSUM}",
  "urls": {
    "versioned": "https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/widget-assets/${VERSIONED_PATH}",
    "channel": "https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/widget-assets/${CHANNEL_PATH}",
    "latest": "https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/widget-assets/${LATEST_PATH}"
  }
}
EOF

# Upload version manifest
echo "Uploading version manifest..."
response=$(curl -s -w "\n%{http_code}" -X POST \
    "${STORAGE_URL}/version-${VERSION}.json" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Cache-Control: public, max-age=31536000, immutable" \
    --data-binary "@dist-widget/version.json")

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✓ Version manifest uploaded${NC}"
else
    echo -e "${YELLOW}⚠ Version manifest upload failed (non-critical)${NC}"
fi

# Update database with version info (using Supabase API)
echo -e "\n${YELLOW}📊 Updating version database...${NC}"
curl -s -X POST \
    "https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/widget_versions" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
        \"version\": \"${VERSION}\",
        \"channel\": \"${CHANNEL}\",
        \"file_path\": \"${VERSIONED_PATH}\",
        \"file_size\": ${FILESIZE},
        \"checksum\": \"${CHECKSUM}\",
        \"release_notes\": \"Automated deployment for ${CHANNEL}\"
    }"

# Update latest version flag
if [ "$CHANNEL" = "production" ]; then
    echo "Updating latest version flag..."
    curl -s -X POST \
        "https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/rpc/update_latest_widget_version" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \"new_version\": \"${VERSION}\",
            \"new_channel\": \"${CHANNEL}\"
        }"
fi

echo -e "\n${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "Widget URLs:"
echo "  Versioned: https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/widget-assets/${VERSIONED_PATH}"
echo "  Channel: https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/widget-assets/${CHANNEL_PATH}"
if [ "$CHANNEL" = "production" ]; then
    echo "  Latest: https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/widget-assets/${LATEST_PATH}"
fi
echo ""
echo "Integration snippet:"
echo '  <script src="https://'${SUPABASE_PROJECT_ID}'.supabase.co/storage/v1/object/public/widget-assets/'${CHANNEL}'/widget.js" data-project-key="..." async></script>'

echo -e "\n${GREEN}🎉 Widget deployment to Supabase complete!${NC}"