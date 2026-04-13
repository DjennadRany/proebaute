/**
 * Supabase Edge Function — create-payment-intent
 * Runtime : Deno (Supabase Edge Functions)
 *
 * Déploiement :
 *   supabase functions deploy create-payment-intent --no-verify-jwt
 *
 * Variables d'environnement à configurer dans le dashboard Supabase :
 *   STRIPE_SECRET_KEY=sk_live_...  (ou sk_test_... pour les tests)
 *
 * Appelé depuis stripeApi.ts quand VITE_STRIPE_PUBLISHABLE_KEY est défini.
 */

// @ts-ignore — Deno import
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore — Deno global
Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore — Deno env
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY non configuré dans Supabase Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    const {
      bookingId,
      amountCents,
      proId,
      clientId,
      serviceDescription,
    } = await req.json() as {
      bookingId: string;
      amountCents: number;
      proId: string;
      clientId: string;
      serviceDescription: string;
    };

    if (!bookingId || !amountCents || amountCents < 50) {
      return new Response(
        JSON.stringify({ error: 'Paramètres invalides (bookingId ou amountCents manquant)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency: 'eur',
      description: serviceDescription ?? 'Réservation LocBeauté',
      metadata: {
        booking_id: bookingId,
        pro_id: proId,
        client_id: clientId,
      },
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
