#!/bin/bash

# Deploy Edge Functions After Login
# Run this after you've executed: supabase login

echo "🚀 Deploying VibeQA Edge Functions"
echo "=================================="
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase!"
    echo "   Please run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Link project
echo "📎 Linking project..."
if supabase link --project-ref oussjxzwtxlanuxtgmtt; then
    echo "✅ Project linked successfully"
else
    echo "⚠️  Project might already be linked, continuing..."
fi

echo ""
echo "🚀 Deploying submit-feedback function..."
if supabase functions deploy submit-feedback; then
    echo "✅ Function deployed successfully!"
else
    echo "❌ Function deployment failed"
    exit 1
fi

# Load environment variables to set secrets
if [ -f .env ]; then
    echo ""
    echo "🔐 Setting environment secrets..."
    
    # Extract BREVO_API_KEY from .env
    BREVO_KEY=$(grep "^BREVO_API_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ ! -z "$BREVO_KEY" ]; then
        echo "Setting BREVO_API_KEY..."
        supabase secrets set BREVO_API_KEY="$BREVO_KEY"
        echo "✅ BREVO_API_KEY set"
    else
        echo "⚠️  BREVO_API_KEY not found in .env"
    fi
    
    # Set APP_URL
    echo "Setting APP_URL..."
    supabase secrets set APP_URL="https://vibeqa.app"
    echo "✅ APP_URL set"
fi

echo ""
echo "📋 Deployment Summary"
echo "===================="
supabase functions list

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your Edge Function URL is:"
echo "https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1/submit-feedback"
echo ""
echo "Next steps:"
echo "1. Test with: npm run test-feedback"
echo "2. Try the widget: npm run dev → http://localhost:5173/widget-demo.html"
echo ""