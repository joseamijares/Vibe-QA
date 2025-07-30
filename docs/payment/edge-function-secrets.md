# Edge Function Secrets Configuration

This guide helps you set up the required secrets for your Stripe Edge Functions.

## Required Secrets

### 1. STRIPE_SECRET_KEY

Your Stripe secret key for API operations.

**To find it:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Copy your Secret key (starts with `sk_test_` for test mode)

**Set the secret:**
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### 2. STRIPE_WEBHOOK_SECRET

The webhook signing secret (we'll get this after creating the webhook).

**Set the secret (after webhook creation):**
```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### 3. APP_URL

Your application URL for redirects after checkout.

**For development:**
```bash
npx supabase secrets set APP_URL=http://localhost:5173
```

**For production:**
```bash
npx supabase secrets set APP_URL=https://your-domain.com
```

## Webhook Configuration in Stripe

### Step 1: Create Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1/stripe-webhook
   ```

### Step 2: Select Events

Select the following events to listen for:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Step 3: Get Signing Secret

1. After creating the webhook, you'll see the webhook details
2. Click **"Reveal"** next to Signing secret
3. Copy the secret (starts with `whsec_`)
4. Set it as a secret:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

## Verify Secrets

To verify your secrets are set:
```bash
npx supabase secrets list
```

## Testing the Integration

### Local Testing with Stripe CLI

1. Install Stripe CLI if you haven't:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward events to your local Edge Function:
   ```bash
   stripe listen --forward-to https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1/stripe-webhook
   ```

4. Trigger a test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Testing from the App

1. Navigate to `/dashboard/settings/billing`
2. Click "Upgrade to Basic" or "Upgrade to Full"
3. Complete the checkout with test card: `4242 4242 4242 4242`
4. Verify subscription is created in your database

## Troubleshooting

### "Missing required fields" error
- Ensure all secrets are set correctly
- Check Edge Function logs in Supabase Dashboard

### "Webhook signature verification failed"
- Verify STRIPE_WEBHOOK_SECRET matches the one in Stripe Dashboard
- Ensure you're using the correct endpoint URL

### "No such price" error
- Verify you're using the correct Stripe mode (test vs live)
- Check price IDs match between Edge Function and Stripe Dashboard