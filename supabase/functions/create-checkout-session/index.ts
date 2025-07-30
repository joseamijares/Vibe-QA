import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { planId, organizationId, userId, email } = await req.json();

    if (!planId || !organizationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabaseClient
      .from('organization_subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          organization_id: organizationId,
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabaseClient
        .from('organization_subscriptions')
        .upsert({
          organization_id: organizationId,
          stripe_customer_id: customerId,
          status: 'incomplete',
        });
    }

    // Get price ID based on plan
    const priceId = getPriceId(planId);
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('APP_URL')}/dashboard/settings/billing?success=true`,
      cancel_url: `${Deno.env.get('APP_URL')}/dashboard/settings/billing?canceled=true`,
      metadata: {
        organization_id: organizationId,
        user_id: userId,
        plan_id: planId,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper to get Stripe price ID from plan ID
function getPriceId(planId: string): string | null {
  // TODO: Replace with actual Stripe price IDs after creating products in Stripe Dashboard
  const priceIds: Record<string, string> = {
    basic: 'price_1QqXXXPPLO371ouZXXXXXXXX', // Replace with actual Basic plan price ID
    full: 'price_1QqYYYPPLO371ouZYYYYYYYY', // Replace with actual Full plan price ID
  };
  return priceIds[planId] || null;
}