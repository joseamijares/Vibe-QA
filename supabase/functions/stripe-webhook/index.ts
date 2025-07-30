import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseClient, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseClient, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseClient, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(supabaseClient, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabaseClient, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500 }
    );
  }
});

async function handleCheckoutCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const { organization_id, plan_id } = session.metadata!;

  // Update subscription status
  await supabase
    .from('organization_subscriptions')
    .update({
      stripe_subscription_id: session.subscription as string,
      status: 'active',
      plan_id,
    })
    .eq('stripe_customer_id', session.customer as string);

  // Update organization
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
      subscription_plan_id: plan_id,
    })
    .eq('id', organization_id);
}

async function handleSubscriptionUpdate(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const planId = subscription.metadata.plan_id || 'free';

  await supabase
    .from('organization_subscriptions')
    .update({
      status: subscription.status,
      plan_id: planId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at: subscription.cancel_at 
        ? new Date(subscription.cancel_at * 1000).toISOString() 
        : null,
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
    })
    .eq('stripe_customer_id', customerId);

  // Get organization ID
  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('organization_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (sub) {
    await supabase
      .from('organizations')
      .update({
        subscription_status: subscription.status,
        subscription_plan_id: planId,
      })
      .eq('id', sub.organization_id);
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  await supabase
    .from('organization_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  // Get organization ID
  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('organization_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (sub) {
    await supabase
      .from('organizations')
      .update({
        subscription_status: 'canceled',
        subscription_plan_id: 'free',
      })
      .eq('id', sub.organization_id);
  }
}

async function handleInvoicePaymentSucceeded(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  // Get organization ID
  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('organization_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (sub) {
    // Save invoice record
    await supabase
      .from('invoices')
      .insert({
        organization_id: sub.organization_id,
        stripe_invoice_id: invoice.id,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status || 'paid',
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        period_start: invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : null,
        period_end: invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null,
      });
  }
}

async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  // Update subscription status to past_due
  await supabase
    .from('organization_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_customer_id', customerId);

  // Get organization ID
  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('organization_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (sub) {
    await supabase
      .from('organizations')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', sub.organization_id);

    // TODO: Send email notification about failed payment
  }
}