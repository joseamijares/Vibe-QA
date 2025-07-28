#!/bin/bash

# Email System Deployment Script
# This script helps deploy the email Edge Functions to Supabase

echo "======================================"
echo "Email System Deployment Instructions"
echo "======================================"
echo ""
echo "To deploy the email system, follow these steps:"
echo ""
echo "1. First, log in to Supabase CLI:"
echo "   supabase login"
echo ""
echo "2. Set the required secrets:"
echo "   supabase secrets set BREVO_API_KEY='your-brevo-api-key'"
echo "   supabase secrets set APP_URL='your-app-url'"
echo ""
echo "3. Deploy the Edge Functions:"
echo "   supabase functions deploy send-invitation-email"
echo "   supabase functions deploy send-feedback-notification"
echo "   supabase functions deploy submit-feedback"
echo ""
echo "4. Push database migrations (if not already done):"
echo "   supabase db push"
echo ""
echo "5. Verify deployment:"
echo "   supabase functions list"
echo ""
echo "======================================"
echo ""
echo "Would you like to see the current project status? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Current Supabase project status:"
    supabase status
fi