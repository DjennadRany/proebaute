// IMPORTANT: La cle PUBLISHABLE Stripe va dans .env.local
// VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
// La cle SECRETE ne va JAMAIS dans le frontend
//
// Si @stripe/stripe-js n'est pas installe, executer :
//   npm install @stripe/stripe-js
// ou
//   pnpm add @stripe/stripe-js

import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!STRIPE_KEY) {
      console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY manquant - paiement desactive');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(STRIPE_KEY);
  }
  return stripePromise;
}

// Calcule les montants (en centimes)
export function calculateAmounts(totalCents: number): {
  platformFeeCents: number;
  proAmountCents: number;
  totalCents: number;
} {
  const platformFeeCents = Math.round(totalCents * 0.10); // 10% commission
  const proAmountCents = totalCents - platformFeeCents;
  return { platformFeeCents, proAmountCents, totalCents };
}

// Formate un montant en centimes vers euros affichable
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

// Simule la creation d'un PaymentIntent (en attendant le backend)
// En production, cet appel va vers votre API backend (Supabase Edge Function)
export async function createPaymentIntent(params: {
  bookingId: string;
  amountCents: number;
  proId: string;
  clientId: string;
  serviceDescription: string;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  // TODO PRODUCTION: Remplacer par un appel a votre Supabase Edge Function
  // const response = await fetch('/api/create-payment-intent', {
  //   method: 'POST', body: JSON.stringify(params), headers: { 'Content-Type': 'application/json' }
  // });
  // return response.json();

  // SIMULATION (pour la maquette) :
  const simulatedIntentId = 'pi_simulated_' + Date.now();
  const simulatedSecret = simulatedIntentId + '_secret_test';
  console.log('[Stripe SIMULATION] PaymentIntent cree:', { ...params, simulatedIntentId });
  return { clientSecret: simulatedSecret, paymentIntentId: simulatedIntentId };
}

// Simule la confirmation d'un paiement
export async function confirmPayment(
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  // TODO PRODUCTION: Utiliser stripe.confirmCardPayment(clientSecret, { payment_method: ... })
  console.log('[Stripe SIMULATION] Paiement confirme pour:', clientSecret);
  await new Promise((r) => setTimeout(r, 1500)); // simule le delai reseau
  return { success: true };
}
