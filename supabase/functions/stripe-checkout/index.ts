import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_CONFIG: Record<string, { name: string; amount: number }> = {
  starter: { name: "WorkforceAI Starter", amount: 4900 },
  growth: { name: "WorkforceAI Growth", amount: 14900 },
  pro: { name: "WorkforceAI Pro", amount: 39900 },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { planId } = await req.json();
    const plan = PLAN_CONFIG[planId];
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch Stripe secret key from app_secrets
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: secretRow } = await serviceClient
      .from("app_secrets")
      .select("key_value")
      .eq("key_name", "STRIPE_SECRET_KEY")
      .maybeSingle();

    if (!secretRow?.key_value) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = secretRow.key_value;
    const origin = req.headers.get("origin") || "https://cncccdafbcfzldxpugrw.supabase.co";

    const params = new URLSearchParams({
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(plan.amount),
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]": plan.name,
      "line_items[0][price_data][product_data][tax_code]": "txcd_10103001",
      "line_items[0][quantity]": "1",
      "mode": "subscription",
      "success_url": `${origin}/dashboard?checkout=success`,
      "cancel_url": `${origin}/dashboard?checkout=cancelled`,
      "client_reference_id": user.id,
      "metadata[plan_id]": planId,
    });
    if (user.email) {
      params.set("customer_email", user.email);
    }

    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${stripeKey}`,
      },
      body: params,
    });

    if (!sessionResponse.ok) {
      const err = await sessionResponse.json();
      return new Response(
        JSON.stringify({ error: err.error?.message || "Failed to create checkout session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await sessionResponse.json();

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
