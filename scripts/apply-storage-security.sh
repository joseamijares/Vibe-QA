#!/bin/bash

# Apply Storage Security Fixes V2
# This script applies the simplified storage security migration based on security review

set -e

echo "🔒 Applying Storage Security Fixes V2..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Remove old migration if exists
echo "🧹 Cleaning up old migration..."
rm -f supabase/migrations/20250801_fix_storage_rls_policies.sql

# Apply the new migration
echo "📝 Applying simplified RLS policy migration..."
supabase migration up

# Deploy updated Edge Functions
echo "🚀 Deploying updated Edge Functions..."
supabase functions deploy submit-feedback

# Verify the deployment
echo "✅ Verifying deployment..."
supabase functions list

echo "🎉 Storage security fixes V2 applied successfully!"
echo ""
echo "📋 What changed:"
echo "- Simplified RLS policies for better performance"
echo "- All uploads now go through Edge Functions"
echo "- Removed complex database functions"
echo "- Improved MIME type validation"
echo ""
echo "⚠️  Important next steps:"
echo "1. Test file uploads through the widget"
echo "2. Verify existing files are still accessible"
echo "3. Monitor error logs for any access issues"
echo "4. Run cleanup function periodically: SELECT cleanup_orphaned_storage_objects();"