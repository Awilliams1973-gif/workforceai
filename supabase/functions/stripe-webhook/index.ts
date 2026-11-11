import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};
async function verifyStripeSignature(payload, signature, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, [
    "verify"
  ]);
  const parts = signature.split(",");
  const tPart = parts.find((p)=>p.startsWith("t="));
  // Stripe sends one v1 signature per active secret while a rolled secret is still valid.
  const v1Parts = parts.filter((p)=>p.startsWith("v1="));
  if (!tPart || v1Parts.length === 0) return false;
  const timestamp = tPart.slice(2);
  const signedPayload = `${timestamp}.${payload}`;
  for (const v1Part of v1Parts){
    const signatureHex = v1Part.slice(3).trim();
    if (!/^([0-9a-fA-F]{2})+$/.test(signatureHex)) continue;
    const signatureBytes = new Uint8Array(signatureHex.match(/.{1,2}/g).map((b)=>parseInt(b, 16)));
    if (await crypto.subtle.verify("HMAC", key, signatureBytes, enc.encode(signedPayload))) return true;
  }
  return false;
}
// Newer Stripe API versions moved current_period_end onto the subscription items.
function periodEndIso(subscription) {
  const end = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  return typeof end === "number" ? new Date(end * 1000).toISOString() : null;
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SB_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const runtimeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
    const { data: secretRow } = await supabase.from("app_secrets").select("key_value").eq("key_name", "STRIPE_WEBHOOK_SECRET").maybeSingle();
    const webhookSecret = runtimeWebhookSecret || secretRow?.key_value?.trim();
    if (!webhookSecret) {
      return new Response(JSON.stringify({
        error: "Webhook secret not configured"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({
        error: "Missing signature"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const isValid = await verifyStripeSignature(payload, signature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({
        error: "Invalid signature"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const event = JSON.parse(payload);
    switch(event.type){
      case "checkout.session.completed":
        {
          const session = event.data.object;
          const userId = session.client_reference_id || session.metadata?.user_id;
          const customerId = session.customer;
          const subscriptionId = session.subscription;
          if (userId && subscriptionId) {
            const planName = session.metadata?.plan_id || "starter";
            const runtimeStripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
            const { data: secretKeyRow } = await supabase.from("app_secrets").select("key_value").eq("key_name", "STRIPE_SECRET_KEY").maybeSingle();
            const stripeSecretKey = runtimeStripeSecretKey || secretKeyRow?.key_value?.trim();
            if (!stripeSecretKey) {
              return new Response(JSON.stringify({
                error: "Stripe API key is not configured"
              }), {
                status: 500,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json"
                }
              });
            }
            const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
              headers: {
                Authorization: `Bearer ${stripeSecretKey}`
              }
            });
            if (!subResponse.ok) {
              return new Response(JSON.stringify({
                error: "Failed to retrieve Stripe subscription"
              }), {
                status: 500,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json"
                }
              });
            }
            const subscription = await subResponse.json();
            const priceId = subscription.items?.data?.[0]?.price?.id || "";
            const { error: upsertError } = await supabase.from("subscriptions").upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              plan_name: planName,
              status: subscription.status || "active",
              current_period_end: periodEndIso(subscription),
              updated_at: new Date().toISOString()
            }, {
              onConflict: "stripe_subscription_id"
            });
            if (upsertError) {
              console.error("Subscription upsert failed:", upsertError.message);
              return new Response(JSON.stringify({
                error: "Failed to save subscription"
              }), {
                status: 500,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json"
                }
              });
            }
          }
          break;
        }
      case "customer.subscription.updated":
      case "customer.subscription.created":
        {
          const subscription = event.data.object;
          const subscriptionId = subscription.id;
          const { data: existing } = await supabase.from("subscriptions").select("user_id,plan_name").eq("stripe_subscription_id", subscriptionId).maybeSingle();
          if (existing) {
            const priceId = subscription.items?.data?.[0]?.price?.id || "";
            const planName = subscription.metadata?.plan_id || existing.plan_name || "starter";
            await supabase.from("subscriptions").update({
              status: subscription.status,
              stripe_price_id: priceId,
              plan_name: planName,
              current_period_end: periodEndIso(subscription),
              updated_at: new Date().toISOString()
            }).eq("stripe_subscription_id", subscriptionId);
          }
          break;
        }
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object;
          await supabase.from("subscriptions").update({
            status: "canceled",
            updated_at: new Date().toISOString()
          }).eq("stripe_subscription_id", subscription.id);
          break;
        }
    }
    return new Response(JSON.stringify({
      received: true
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
