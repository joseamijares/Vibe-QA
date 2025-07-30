# Setting Up Stripe Secrets - Quick Guide

## 1. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode)
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)

## 2. Set Edge Function Secrets

Run these commands to set the secrets for your Edge Functions:

```bash
# Set your Stripe secret key (replace with your actual key)
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Set the app URL (for local development)
npx supabase secrets set APP_URL=http://localhost:5173

# For production, use your actual domain:
# npx supabase secrets set APP_URL=https://vibeqa.app
```

## 3. Create Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter this endpoint URL:
   ```
   https://oussjxzwtxlanuxtgmtt.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. After creating, click **"Reveal"** next to Signing secret
6. Copy the secret (starts with `whsec_`)
7. Set it as a secret:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

## 4. Update Local Environment

Add to your `.env.local` file:

```bash
# Stripe publishable key (for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

## 5. Verify Setup

Check that all secrets are set:
```bash
npx supabase secrets list
```

You should see:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- APP_URL
- BREVO_API_KEY (already set)

## 6. Test the Integration

1. Start your local development server:
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:5173/dashboard/settings/billing

3. Click "Upgrade to Basic" or "Upgrade to Full"

4. Use test card: `4242 4242 4242 4242`

5. Complete the checkout and verify subscription is created

## Next Steps

After setting up the secrets:
1. Test the checkout flow
2. Verify webhook events are being received
3. Check database updates after successful payment
4. Test subscription management features