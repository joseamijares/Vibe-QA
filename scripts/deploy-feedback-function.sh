#!/bin/bash

# Deploy Feedback Submission Edge Function
# This script helps deploy the submit-feedback function to Supabase

echo "======================================"
echo "Feedback Function Deployment Script"
echo "======================================"
echo ""

# Check if user is logged in to Supabase
echo "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ You need to login to Supabase first."
    echo "   Run: supabase login"
    exit 1
fi

echo "✅ Supabase authentication verified"
echo ""

# Check if project is linked
echo "Checking project link..."
if ! supabase status &> /dev/null; then
    echo "❌ No Supabase project linked."
    echo "   Run: supabase link --project-ref your-project-ref"
    exit 1
fi

echo "✅ Project linked successfully"
echo ""

# Show current project
echo "Current project:"
supabase status | grep "Project" | head -n 3
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^(BREVO_API_KEY|APP_URL)=' | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "⚠️  No .env file found. Make sure to set secrets manually."
fi

# Deploy Edge Function
echo ""
echo "Deploying submit-feedback function..."
echo "======================================"

# First, ensure the function directory exists
if [ ! -d "supabase/functions/submit-feedback" ]; then
    echo "❌ Function directory not found: supabase/functions/submit-feedback"
    exit 1
fi

# Deploy the function
if supabase functions deploy submit-feedback; then
    echo "✅ Function deployed successfully!"
else
    echo "❌ Function deployment failed"
    exit 1
fi

# Set secrets if environment variables are available
echo ""
echo "Setting Edge Function secrets..."
echo "======================================"

if [ ! -z "$BREVO_API_KEY" ]; then
    echo "Setting BREVO_API_KEY..."
    supabase secrets set BREVO_API_KEY="$BREVO_API_KEY"
    echo "✅ BREVO_API_KEY set"
else
    echo "⚠️  BREVO_API_KEY not found in .env"
fi

if [ ! -z "$APP_URL" ]; then
    echo "Setting APP_URL..."
    supabase secrets set APP_URL="$APP_URL"
    echo "✅ APP_URL set"
else
    echo "⚠️  APP_URL not found in .env"
fi

# List all functions to verify deployment
echo ""
echo "Deployed functions:"
echo "======================================"
supabase functions list

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the function with: npm run test-feedback"
echo "2. Check logs with: supabase functions logs submit-feedback"
echo "3. Update widget configuration with your Supabase URL"
echo ""
echo "Your function URL is:"
echo "https://[YOUR-PROJECT-ID].supabase.co/functions/v1/submit-feedback"
echo ""