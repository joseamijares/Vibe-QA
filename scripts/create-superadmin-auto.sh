#!/bin/bash

# Automated Superadmin User Creation Script for VibeQA
# This script creates a superadmin user programmatically

echo "====================================="
echo "VibeQA Superadmin User Creation"
echo "====================================="
echo

# Check if we're in the project directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Please run this script from the VibeQA project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js first: https://nodejs.org"
    exit 1
fi

# Check if TypeScript is installed
if ! command -v npx &> /dev/null; then
    echo "Error: npx is not available."
    echo "Please ensure npm is properly installed."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found."
    echo "Please copy .env.example to .env and fill in your values."
    echo
    echo "cp .env.example .env"
    echo
    exit 1
fi

# Check if service role key is set
if ! grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env || grep -q "SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key" .env; then
    echo "Error: SUPABASE_SERVICE_ROLE_KEY not set in .env"
    echo
    echo "To get your service role key:"
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to Settings → API"
    echo "3. Copy the 'service_role' key (under 'Project API keys')"
    echo "4. Add it to .env:"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key"
    echo
    echo "⚠️  IMPORTANT: Keep this key secret! It has admin privileges."
    exit 1
fi

echo "Running superadmin creation script..."
echo

# Run the TypeScript script using tsx
npx tsx scripts/create-superadmin-programmatic.ts

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo
    echo "✅ Superadmin setup completed successfully!"
else
    echo
    echo "❌ Superadmin setup failed. Please check the error messages above."
    exit 1
fi