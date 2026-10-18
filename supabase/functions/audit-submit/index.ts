import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type TurnstileResult = "valid" | "invalid" | "unconfigured";

async function verifyTurnstile(token: string | null, req: Request): Promise<TurnstileResult> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim();
  if (!secret) return "unconfigured";
  if (!token) return "invalid";
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return "invalid";
  const result = await response.json();
  return result.success === true ? "valid" : "invalid";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { submission, turnstileToken } = await req.json();
    const turnstileResult = await verifyTurnstile(turnstileToken || null, req);
    if (turnstileResult === "unconfigured") {
      console.error("Turnstile verification is not configured.");
      return new Response(JSON.stringify({ error: "Audit service is not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (turnstileResult === "invalid") {
      return new Response(JSON.stringify({ error: "Verification failed. Please try again." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Audit service is not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const monthly = Number(submission?.monthlyInquiries);
    const unanswered = Number(submission?.unansweredInquiries);
    const value = Number(submission?.averageCustomerValue);
    if (!submission?.name || !submission?.businessName || !submission?.email || !submission?.industry
      || !Number.isInteger(monthly) || monthly < 1 || !Number.isInteger(unanswered) || unanswered < 0
      || unanswered > monthly || !Number.isFinite(value) || value < 0) {
      return new Response(JSON.stringify({ error: "Invalid audit submission" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const estimatedOpportunity = Math.round(unanswered * value * 0.4 * 12);
    const { error } = await supabase.from("business_audit_submissions").insert({
      name: String(submission.name).trim(),
      business_name: String(submission.businessName).trim(),
      email: String(submission.email).trim(),
      phone: submission.phone ? String(submission.phone).trim() : null,
      website: submission.website ? String(submission.website).trim() : null,
      industry: String(submission.industry).trim(),
      monthly_inquiries: monthly,
      unanswered_inquiries: unanswered,
      average_customer_value: value,
      estimated_opportunity: estimatedOpportunity,
    });
    if (error) {
      if (error.message.includes("Too many audit submissions")) {
        return new Response(JSON.stringify({ error: "Too many submissions. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" } });
      }
      console.error("Audit insert failed:", error);
      return new Response(JSON.stringify({ error: "Unable to submit audit" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ estimatedOpportunity }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Audit function failed:", error);
    return new Response(JSON.stringify({ error: "Unable to submit audit" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
