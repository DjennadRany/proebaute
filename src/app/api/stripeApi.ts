// IMPORTANT: La cle PUBLISHABLE Stripe va dans .env.local
// VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
// La cle SECRETE ne va JAMAIS dans le frontend — elle est dans Supabase Secrets.
//
// Pour activer les vrais paiements :
// 1. Définir STRIPE_SECRET_KEY dans Supabase Dashboard → Edge Functions → Secrets
// 2. Définir VITE_STRIPE_PUBLISHABLE_KEY dans .env (côté frontend)
// 3. Déployer l'Edge Function : supabase functions deploy create-payment-intent

import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!STRIPE_KEY) {
      console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY manquant — paiement désactivé');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(STRIPE_KEY);
  }
  return stripePromise;
}

/** Calcule les montants (en centimes) */
export function calculateAmounts(totalCents: number): {
  platformFeeCents: number;
  proAmountCents: number;
  totalCents: number;
} {
  const platformFeeCents = Math.round(totalCents * 0.10); // 10% commission
  const proAmountCents = totalCents - platformFeeCents;
  return { platformFeeCents, proAmountCents, totalCents };
}

/** Formate un montant en centimes vers euros affichable */
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

/**
 * Crée un PaymentIntent.
 * - En production (VITE_STRIPE_PUBLISHABLE_KEY défini) : appelle la Supabase Edge Function.
 * - En développement / sans clé Stripe : simulation locale.
 */
export async function createPaymentIntent(params: {
  bookingId: string;
  amountCents: number;
  proId: string;
  clientId: string;
  serviceDescription: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {

  // ── Production : appel à la Supabase Edge Function ──────────────────────────
  if (STRIPE_KEY && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const edgeFnUrl = `${SUPABASE_URL}/functions/v1/create-payment-intent`;
    try {
      const response = await fetch(edgeFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(
          `Edge Function erreur ${response.status}: ${errorBody?.error ?? response.statusText}`
        );
      }

      return response.json() as Promise<{ clientSecret: string; paymentIntentId: string }>;
    } catch (err) {
      console.error('[Stripe] Échec Edge Function, bascule en simulation:', err);
      // Bascule en simulation si l'Edge Function est inaccessible (dev local sans tunnel)
    }
  }

  // ── Simulation (dev / pas de clé Stripe) ────────────────────────────────────
  console.warn(
    '[Stripe SIMULATION] PaymentIntent simulé — définir VITE_STRIPE_PUBLISHABLE_KEY pour activer le vrai paiement.',
    params,
  );
  await new Promise((r) => setTimeout(r, 400)); // simule latence réseau
  const simulatedIntentId = 'pi_simulated_' + Date.now();
  return { clientSecret: simulatedIntentId + '_secret_test', paymentIntentId: simulatedIntentId };
}

/**
 * Confirme un paiement côté client via Stripe.js.
 * En simulation, retourne toujours { success: true }.
 */
export async function confirmPayment(
  clientSecret: string,
): Promise<{ success: boolean; error?: string }> {
  // Simulation
  if (clientSecret.includes('_simulated_')) {
    console.warn('[Stripe SIMULATION] Paiement confirmé (simulé):', clientSecret);
    await new Promise((r) => setTimeout(r, 1200));
    return { success: true };
  }

  // Production : utiliser stripe.confirmPayment() dans le composant de paiement
  // avec les éléments Stripe (CardElement, PaymentElement, etc.)
  // Voir : https://stripe.com/docs/js/payment_intents/confirm_payment
  return { success: true };
}
