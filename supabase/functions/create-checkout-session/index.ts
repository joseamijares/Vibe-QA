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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { planId, organizationId } = await req.json();

    if (!planId || !organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user has access to this organization
    const { data: member } = await supabaseClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - only owners can manage billing' }),
        { 
          status: 403, 
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
        email: user.email,
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
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

    // Check if organization is still in trial
    const { data: orgData } = await supabaseClient
      .from('organization_trial_status')
      .select('trial_status, days_remaining')
      .eq('organization_id', organizationId)
      .single();

    const isInTrial = orgData?.trial_status === 'active';
    const daysRemaining = orgData?.days_remaining || 0;

    // Create checkout session with trial configuration
    const sessionConfig: any = {
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
        user_id: user.id,
        plan_id: planId,
      },
      // Configure payment collection behavior
      payment_method_collection: 'if_required',
      // Allow promotion codes
      allow_promotion_codes: true,
    };

    // If still in trial, configure trial days
    if (isInTrial && daysRemaining > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: daysRemaining,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'pause', // Pause subscription if no payment method at trial end
          },
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
  const priceIds: Record<string, string> = {
    basic: Deno.env.get('STRIPE_PRICE_BASIC') || 'price_1RqOW0PPLO371ouZKnwpduMZ', // VibeQA Basic - $5/month
    full: Deno.env.get('STRIPE_PRICE_FULL') || 'price_1RqOWHPPLO371ouZyEUGXuuT', // VibeQA Full - $14/month
  };
  return priceIds[planId] || null;
}