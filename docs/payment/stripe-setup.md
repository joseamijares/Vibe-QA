# Stripe Payment Integration Setup

This guide walks through setting up Stripe payments for VibeQA.

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
- **Price ID**: Copy this for your Edge Function

#### Full Plan
- **Name**: VibeQA Full
- **Description**: For growing teams
- **Pricing**: $14.00/month
- **Price ID**: Copy this for your Edge Function

### Configure Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://[your-project-id].supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** for your environment variables

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
    basic: 'price_1ABC...', // Replace with your actual Basic price ID
    full: 'price_1XYZ...', // Replace with your actual Full price ID
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

## 5. Testing

### Test Checkout Flow

1. Navigate to `/dashboard/settings/billing`
2. Click "Upgrade to Starter" or "Upgrade to Pro"
3. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

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

## 6. Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update Edge Function secrets with live keys
- [ ] Update webhook endpoint URL to production
- [ ] Test with real payment method
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications
- [ ] Set up usage alerts

## 7. Usage Tracking

The system automatically tracks:
- Feedback count per month
- Storage usage
- API calls
- Team member count

Usage is checked against plan limits before allowing actions.

## 8. Customer Portal

To enable customers to manage their subscriptions:

1. Enable Customer Portal in Stripe Dashboard
2. Configure allowed actions (cancel, update payment method)
3. Add portal link to billing page

## 9. Common Issues

### "No such price" error
- Verify price IDs in Edge Function match Stripe Dashboard
- Ensure you're using the correct mode (test vs live)

### Webhook signature verification failed
- Check STRIPE_WEBHOOK_SECRET is correct
- Ensure you're using the right endpoint secret

### Customer not found
- Check organization_subscriptions table has stripe_customer_id
- Verify customer exists in Stripe Dashboard

## 10. Monitoring

Monitor these in production:
- Failed payment webhook events
- Subscription cancellations
- Usage approaching limits
- Edge Function errors

Use Supabase Dashboard to monitor Edge Function logs and database queries.