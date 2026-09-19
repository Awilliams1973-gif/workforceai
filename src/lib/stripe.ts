import { supabase } from './supabase';

export async function startCheckout(planId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Please sign in to subscribe.');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ planId }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to start checkout' }));
    throw new Error(err.error || 'Failed to start checkout');
  }

  const { url } = await response.json();
  if (url) {
    window.location.href = url;
  }
}
