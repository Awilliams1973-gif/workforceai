import { supabase } from '@/lib/supabase';

export type PlanId = 'starter' | 'professional';

export const PLANS: { id: PlanId; name: string; price: number; features: string[] }[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    features: ['AI receptionist chat widget', 'Lead and appointment capture', 'Knowledge base'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    features: ['Everything in Starter', 'Higher usage for growing teams', 'Priority support'],
  },
];

export async function startCheckout(planId: PlanId): Promise<void> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { planId },
  });
  if (error) throw new Error('Could not start checkout. Please try again.');
  const url = (data as { url?: string } | null)?.url;
  if (!url || !url.startsWith('https://checkout.stripe.com/')) {
    throw new Error('Could not start checkout. Please try again.');
  }
  window.location.assign(url);
}
