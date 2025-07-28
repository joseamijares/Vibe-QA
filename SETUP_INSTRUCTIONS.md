# VibeQA Setup Instructions

Follow these steps to get VibeQA widget working:

## Step 1: Set Up Database (REQUIRED FIRST!)

1. Open your Supabase Dashboard
2. Go to SQL Editor (left sidebar)
3. Click "New Query"
4. Copy ALL contents from `scripts/setup-database.sql`
5. Paste and click "Run"

✅ You should see success messages and a test project created with API key: `proj_test123456789`

## Step 2: Create Storage Buckets

In Supabase Dashboard:

1. Go to Storage (left sidebar)
2. Create bucket: `feedback-media` (Private)
3. Create bucket: `organization-assets` (Private)

## Step 3: Deploy Edge Functions

```bash
# Login to Supabase CLI
supabase login

# Link your project (use your project ref from dashboard)
supabase link --project-ref oussjxzwtxlanuxtgmtt

# Deploy the feedback function
./scripts/deploy-feedback-function.sh
```

## Step 4: Test Everything

```bash
# Quick test to verify setup
./scripts/quick-test.sh

# Test feedback submission
npm run test-feedback

# Start dev server and test widget
npm run dev
# Open: http://localhost:5173/widget-demo.html
```

## Troubleshooting

### "relation does not exist" Error
- You need to run `scripts/setup-database.sql` first!

### Function not found (404)
- Deploy Edge Functions with the script above

### Authentication errors
- Check that test project was created in database
- Verify API key matches: `proj_test123456789`

## Your Configuration

- Supabase URL: `https://oussjxzwtxlanuxtgmtt.supabase.co`
- Test API Key: `proj_test123456789`
- Edge Function: `https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1/submit-feedback`

---

📚 For detailed instructions, see:
- Database setup: `docs/database-setup.md`
- Backend setup: `docs/widget/backend-setup-guide.md`
- Deployment: `docs/widget/deployment-guide.md`