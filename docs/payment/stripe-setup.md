# Stripe Payment Integration Setup

**Last Updated**: January 31, 2025

This guide walks through setting up Stripe payments for VibeQA, including the 7-day trial system and subscription management.

## Prerequisites

- Stripe account (test mode for development)
- Supabase project with Edge Functions enabled
- Environment variables configured

## 1. Stripe Dashboard Setup

### Create Products and Prices

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add product**
3. Create the following products:

#### Basic Plan
- **Name**: VibeQA Basic
- **Description**: Perfect for small teams
- **Pricing**: $5.00/month
- **Price ID**: `price_1RqOW0PPLO371ouZKnwpduMZ`
- **Product ID**: `prod_SlwOsxuIQxDCxz`

#### Full Plan
- **Name**: VibeQA Full
- **Description**: For growing teams
- **Pricing**: $14.00/month
- **Price ID**: `price_1RqOWHPPLO371ouZyEUGXuuT`
- **Product ID**: `prod_SlwPOGHzOMhgl8`

### Configure Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://[your-project-id].supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** for your environment variables

### Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable the Customer Portal
3. Configure allowed actions:
   - ✅ Update payment methods
   - ✅ Cancel subscriptions
   - ✅ View invoices
   - ✅ Update billing address
4. Set cancellation behavior to "Cancel at end of period"
5. Customize branding to match VibeQA

## 2. Environment Variables

Add these to your `.env.local` and Supabase Edge Function secrets:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # From webhook configuration

# App URL (for redirects)
APP_URL=http://localhost:5173 # Or your production URL
```

## 3. Update Edge Functions

### Update Price IDs

Edit `/supabase/functions/create-checkout-session/index.ts`:

```typescript
function getPriceId(planId: string): string | null {
  const priceIds: Record<string, string> = {
    basic: 'price_1RqOW0PPLO371ouZKnwpduMZ', // VibeQA Basic - $5/month
    full: 'price_1RqOWHPPLO371ouZyEUGXuuT', // VibeQA Full - $14/month
  };
  return priceIds[planId] || null;
}
```

### Deploy Edge Functions

```bash
# Deploy checkout session function
npx supabase functions deploy create-checkout-session

# Deploy webhook handler
npx supabase functions deploy stripe-webhook

# Deploy customer portal session function
npx supabase functions deploy create-portal-session

# Set secrets
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set APP_URL=https://vibeqa.app
```

## 4. Database Migration

Ensure the subscription tables are created:

```bash
npx supabase db push
```

## 5. Trial System Implementation

### How Trials Work

1. **New User Registration**
   - Automatically starts 7-day trial
   - Creates organization with `trial_ends_at` timestamp
   - Sets subscription status to 'trialing'

2. **During Trial**
   - Full access to all features
   - Trial banner shows days remaining
   - Can upgrade anytime (preserves remaining trial days)

3. **Trial Expiration**
   - Access blocked except billing page
   - Shows trial expired page
   - Must select plan to continue

4. **Trial Preservation**
   - When upgrading during trial, Stripe preserves remaining days
   - No charge until trial ends
   - Can add payment method without immediate charge

## 6. Testing

### Test Checkout Flow

1. Navigate to `/dashboard/settings/billing`
2. Click "Upgrade to Basic" or "Upgrade to Full"
3. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

### Test Trial Flow

1. Create new account - verify 7-day trial starts
2. Check trial banner shows correct days
3. Let trial expire (or manually update `trial_ends_at` in database)
4. Verify access is blocked and trial expired page shows
5. Complete upgrade and verify access is restored

### Test Webhook

Use Stripe CLI for local testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local function
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

## 7. Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update Edge Function secrets with live keys
- [ ] Update webhook endpoint URL to production
- [ ] Test with real payment method
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications
- [ ] Set up usage alerts
- [ ] Enable Stripe Tax if needed
- [ ] Configure dunning emails for failed payments
- [ ] Set up revenue reporting

## 8. Usage Tracking

The system automatically tracks:
- Feedback count per month
- Storage usage
- API calls
- Team member count

Usage is checked against plan limits before allowing actions.

## 9. Customer Portal Integration

The Customer Portal is fully integrated:

1. **Access**: Click "Manage Subscription" on billing page
2. **Features Available**:
   - Update payment method
   - Download invoices
   - Cancel subscription
   - Update billing address
3. **Implementation**: `create-portal-session` Edge Function handles session creation

## 10. Common Issues

### "No such price" error
- Verify price IDs in Edge Function match Stripe Dashboard
- Ensure you're using the correct mode (test vs live)

### Webhook signature verification failed
- Check STRIPE_WEBHOOK_SECRET is correct
- Ensure you're using the right endpoint secret

### Customer not found
- Check organization_subscriptions table has stripe_customer_id
- Verify customer exists in Stripe Dashboard

### Trial not preserving on upgrade
- Ensure `trial_end` is passed to Stripe Checkout
- Check that subscription is in 'trialing' status
- Verify trial_end date is in the future

### Webhook events processing multiple times
- Check `processed_webhook_events` table for duplicates
- Ensure idempotency check is working
- Verify webhook endpoint isn't being called multiple times

## 11. Monitoring

Monitor these in production:
- Failed payment webhook events
- Subscription cancellations
- Trial conversion rate
- Usage approaching limits
- Edge Function errors
- Trial expiration notifications

Use Supabase Dashboard to monitor Edge Function logs and database queries.

## 12. Related Documentation

- [Trial & Subscription Implementation](/docs/features/trial-subscription-implementation.md)
- [Edge Function Secrets Setup](/docs/payment/edge-function-secrets.md)
- [Database Schema](/docs/database/schema.md)