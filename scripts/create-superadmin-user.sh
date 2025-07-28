#!/bin/bash

# Create Superadmin User Script for VibeQA
# This script helps set up a superadmin user organization and permissions

echo "====================================="
echo "VibeQA Superadmin User Setup"
echo "====================================="
echo

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Email for the superadmin
ADMIN_EMAIL="support@vibeqa.app"

# Check if we're in the project directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Please run this script from the VibeQA project root directory"
    exit 1
fi

echo "This script will set up organization and permissions for: $ADMIN_EMAIL"
echo
echo "IMPORTANT: Before running this script, you need to create the user in Supabase Dashboard"
echo
echo "Steps to create the user:"
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to Authentication → Users"
echo "3. Click 'Create new user'"
echo "4. Enter email: $ADMIN_EMAIL"
echo "5. Set a secure password"
echo "6. Check 'Auto Confirm Email'"
echo "7. Click 'Create user'"
echo
read -p "Have you created the user in Supabase Dashboard? (y/n): " user_created

if [ "$user_created" != "y" ] && [ "$user_created" != "Y" ]; then
    echo
    echo "Please create the user first, then run this script again."
    echo "Opening Supabase Dashboard..."
    
    # Try to get the project URL
    PROJECT_URL=$(grep "VITE_SUPABASE_URL" .env.local 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$PROJECT_URL" ]; then
        # Extract project ref from URL
        PROJECT_REF=$(echo $PROJECT_URL | sed -n 's/https:\/\/\([^.]*\).*/\1/p')
        echo "Dashboard URL: https://app.supabase.com/project/$PROJECT_REF/auth/users"
    else
        echo "Dashboard URL: https://app.supabase.com (navigate to your project)"
    fi
    exit 0
fi

echo
echo "Setting up organization and permissions..."

# Run the SQL script to set up organization
if supabase db push; then
    echo "✅ Database migrations applied"
else
    echo "⚠️  Warning: Could not apply migrations"
fi

# Execute the SQL script
if psql "$DATABASE_URL" -f scripts/create-superadmin.sql 2>/dev/null || \
   supabase db execute -f scripts/create-superadmin.sql; then
    echo "✅ Organization and permissions set up successfully"
else
    echo "❌ Failed to set up organization. You may need to run the SQL script manually."
    echo "   Run: supabase db execute -f scripts/create-superadmin.sql"
fi

echo
echo "====================================="
echo "Setup Complete!"
echo "====================================="
echo "Superadmin Email: $ADMIN_EMAIL"
echo
echo "The superadmin user can now log in at: http://localhost:5173/login"
echo "Organization: VibeQA Support (slug: vibeqa-support)"
echo
echo "Remember to use the password you set in the Supabase Dashboard."
echo