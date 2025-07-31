#!/bin/bash

# Automated script to create superadmin user (support@vibeqa.app)
# This script uses the Supabase service role key to create the user programmatically

set -e

echo "🚀 VibeQA Superadmin Setup Script"
echo "================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local from .env.example and add your Supabase credentials."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Check required environment variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables!"
    echo "Please ensure these are set in .env.local:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Generate a secure password
PASSWORD=$(openssl rand -base64 32)

echo "📧 Creating user: support@vibeqa.app"

# Create the user using Supabase Admin API
RESPONSE=$(curl -s -X POST \
  "${VITE_SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"support@vibeqa.app\",
    \"password\": \"$PASSWORD\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"is_superadmin\": true
    }
  }")

# Check if user was created or already exists
if echo "$RESPONSE" | grep -q "User already registered"; then
    echo "✅ User already exists, continuing with setup..."
elif echo "$RESPONSE" | grep -q '"id"'; then
    echo "✅ User created successfully!"
    echo ""
    echo "🔐 IMPORTANT: Save this password securely!"
    echo "================================="
    echo "Email: support@vibeqa.app"
    echo "Password: $PASSWORD"
    echo "================================="
    echo ""
else
    echo "❌ Error creating user:"
    echo "$RESPONSE"
    exit 1
fi

# Run the SQL setup
echo "🗄️  Setting up database..."

# First run the migration if not already applied
if [ -f "supabase/migrations/011_superadmin.sql" ]; then
    echo "📝 Applying superadmin migration..."
    npx supabase db push --include-all || true
fi

# Then run the setup script
echo "👤 Configuring superadmin role and permissions..."
npx supabase db execute -f scripts/setup-support-user.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Superadmin setup completed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "  - User: support@vibeqa.app"
    echo "  - Role: superadmin"
    echo "  - Organization: VibeQA Support"
    echo "  - Subscription: Enterprise (unlimited)"
    echo "  - Access: Full platform access"
    echo ""
    echo "🌐 You can now log in at:"
    echo "  - Local: http://localhost:5173/login"
    echo "  - Production: https://app.vibeqa.app/login"
    echo ""
    
    if [ ! -z "$PASSWORD" ]; then
        echo "⚠️  Don't forget to save the password shown above!"
    fi
else
    echo "❌ Error during database setup. Please check the logs above."
    exit 1
fi