import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  buildFinalChatReply,
  buildLeadUpdates,
  extractAppointmentInfo,
  extractLeadInfo,
} from "./lead-extraction.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are WorkforceAI's website assistant. WorkforceAI provides AI tools for local service businesses such as plumbing, HVAC, electrical, roofing, contracting, and property management companies.

What WorkforceAI offers:
- An AI Receptionist that handles website chats, captures leads, and helps with appointment requests.
- AI tools for sales follow-up, appointment support, marketing, and review requests.
- A free AI audit and a live demo can be requested from the website.
- The public pricing page lists Starter at $49/month, Professional at $149/month, and custom Enterprise pricing. Plan sign-up is marked "Coming soon"; the website also says businesses can get started free during rollout. Explain both facts plainly if asked, and do not imply checkout is available.
- Website chat is available first. Phone connections may be added when a business is ready; do not claim a phone line is already connected.

Conversation rules:
- Answer the visitor's actual question directly, using earlier messages for context. Do not ask again for details they already provided.
- Keep replies warm, clear, and concise (usually 1-3 sentences). Ask at most one useful follow-up question at a time.
- This is WorkforceAI's public website assistant, not a contractor's receptionist. You do not have a visitor's business-specific prices, service area, operating hours, account details, or live calendar availability. Never invent these details or claim a service appointment is confirmed.
- You may collect a visitor's contact details and preferred demo or meeting time for the team to follow up. Do not promise a callback time or say a request was submitted unless the system confirms it.
- If you cannot answer confidently, say what is unknown and offer to connect the visitor with the WorkforceAI team.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

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
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!response.ok) {
    console.error("Turnstile Siteverify request failed:", response.status);
    return "invalid";
  }
  const result = await response.json();
  if (result.success !== true) {
    const errorCodes = Array.isArray(result["error-codes"])
      ? result["error-codes"].filter((code: unknown) => typeof code === "string")
      : [];
    console.warn("Turnstile rejected chat token:", errorCodes);
    return "invalid";
  }
  return "valid";
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, sessionId, conversationId, turnstileToken } = await req.json();
    if (typeof sessionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return new Response(JSON.stringify({ error: "A valid chat session is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (conversationId !== undefined && conversationId !== null
      && (typeof conversationId !== "string"
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId))) {
      return new Response(JSON.stringify({ error: "A valid chat conversation is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const turnstileResult = await verifyTurnstile(turnstileToken || null, req);
    if (turnstileResult === "unconfigured") {
      console.error("Turnstile verification is not configured.");
      return new Response(JSON.stringify({ error: "AI Receptionist is temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (turnstileResult === "invalid") {
      console.warn("Chat request rejected because Turnstile verification failed.");
      return new Response(JSON.stringify({ error: "Verification failed. Please try again." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
      return new Response(
        JSON.stringify({ error: "A valid message history is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validMessages = messages.every((message: unknown) => {
      if (!message || typeof message !== "object") return false;
      const candidate = message as { role?: unknown; content?: unknown };
      return ["user", "assistant"].includes(String(candidate.role))
        && typeof candidate.content === "string"
        && candidate.content.trim().length > 0
        && candidate.content.length <= 5000;
    });
    if (!validMessages) {
      return new Response(
        JSON.stringify({ error: "Messages contain invalid content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "AI Receptionist is not configured on the server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKeys = await Promise.all([
      sha256(`ai-chat:ip:${clientIp}`),
      sha256(`ai-chat:session:${sessionId}`),
    ]);
    const rateLimitResults = await Promise.all([
      supabase.rpc('consume_rate_limit', {
        p_key: rateLimitKeys[0],
        p_limit: 120,
        p_window_seconds: 3600,
      }),
      supabase.rpc('consume_rate_limit', {
        p_key: rateLimitKeys[1],
        p_limit: 20,
        p_window_seconds: 3600,
      }),
    ]);
    const rateLimitError = rateLimitResults.find((result) => result.error)?.error;
    if (rateLimitError) {
      console.error('Chat rate-limit check failed:', rateLimitError);
      return new Response(JSON.stringify({ error: 'AI Receptionist is temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (rateLimitResults.some((result) => !result.data)) {
      return new Response(JSON.stringify({ error: 'Too many messages. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' },
      });
    }

    let convoId: string | undefined;

    if (conversationId) {
      const { data: existingConversation, error: conversationLookupError } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (conversationLookupError) {
        console.error("Failed to verify chat conversation:", conversationLookupError);
        return new Response(JSON.stringify({ error: "AI Receptionist is temporarily unavailable" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!existingConversation) {
        return new Response(JSON.stringify({ error: "Chat conversation is unavailable" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      convoId = existingConversation.id;
    } else {
      const { data: convo, error: convoError } = await supabase
        .from("chat_conversations")
        .insert({
          session_id: sessionId,
          status: "active",
        })
        .select("id")
        .single();

      if (convoError) {
        console.error("Failed to create conversation:", convoError);
        // Continue with a response even if persistence is temporarily unavailable.
        convoId = undefined;
      } else {
        convoId = convo.id;
      }
    }

    // Save the user's latest message only when a conversation was created.
    const lastUserMessage = messages.filter((m: ChatMessage) => m.role === "user").pop();
    if (lastUserMessage && convoId) {
      const { error: messageError } = await supabase.from("chat_messages").insert({
        conversation_id: convoId,
        sender: "customer",
        text: lastUserMessage.content,
      });
      if (messageError) console.error("Failed to save customer message:", messageError);
    }

    // Prefer the Edge Function secret; use the database row only as a migration fallback.
    let openaiKey = Deno.env.get("OPENAI_API_KEY")?.trim() || null;
    if (!openaiKey) {
      const { data: secretRow } = await supabase
        .from("app_secrets")
        .select("key_value")
        .eq("key_name", "OPENAI_API_KEY")
        .maybeSingle();
      openaiKey = secretRow?.key_value?.trim() || null;
    }

    let aiReply: string;
    let appointmentCreated = false;

    if (openaiKey) {
      const chatMessages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: chatMessages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error(`OpenAI request failed (${openaiResponse.status}):`, errorText.slice(0, 1000));
        aiReply = getFallbackResponse(lastUserMessage?.content || "");
      } else {
        const openaiData = await openaiResponse.json();
        const generatedReply = openaiData.choices?.[0]?.message?.content;
        if (typeof generatedReply === "string" && generatedReply.trim()) {
          aiReply = generatedReply.trim();
        } else {
          console.error("OpenAI response did not contain a message.");
          aiReply = getFallbackResponse(lastUserMessage?.content || "");
        }
      }
    } else {
      // No API key configured — use rule-based fallback
      aiReply = getFallbackResponse(lastUserMessage?.content || "");
    }

    // Try to extract lead info from the conversation
    const userMessages = messages
      .filter((m: ChatMessage) => m.role === "user")
      .map((m: ChatMessage) => m.content);
    const allUserText = userMessages.join(" ");

    const leadInfo = extractLeadInfo(allUserText);
    const appointmentInfo = extractAppointmentInfo(userMessages);
    const businessId = Deno.env.get("WORKFORCEAI_BUSINESS_ID");
    let persistenceFailed = false;
    let leadCaptured = false;
    if (leadInfo.hasInfo) {
      const update: Record<string, string> = {};
      if (leadInfo.name) update.visitor_name = leadInfo.name;
      if (leadInfo.email) update.visitor_email = leadInfo.email;
      if (leadInfo.phone) update.visitor_phone = leadInfo.phone;
      if (Object.keys(update).length > 0 && convoId) {
        const { error: conversationUpdateError } = await supabase
          .from("chat_conversations")
          .update(update)
          .eq("id", convoId);
          if (conversationUpdateError) {
            console.error("Failed to update visitor details:", conversationUpdateError);
            persistenceFailed = true;
          }
      }

      if (businessId && (leadInfo.email || leadInfo.phone)) {
        const leadName = leadInfo.name || 'Website visitor';
        const leadSource = `AI Receptionist - Chat ${convoId || sessionId}`;
        const { data: existingLead, error: existingLeadError } = await supabase
          .from("leads")
          .select("id")
          .eq("business_id", businessId)
          .eq("source", leadSource)
          .maybeSingle();

        if (existingLeadError) {
          console.error("Failed to check for an existing captured lead:", existingLeadError);
          persistenceFailed = true;
        } else if (existingLead) {
          const leadUpdates = buildLeadUpdates(leadInfo, appointmentInfo);
          if (Object.keys(leadUpdates).length > 0) {
            const { error: leadUpdateError } = await supabase
              .from("leads")
              .update(leadUpdates)
              .eq("id", existingLead.id)
              .eq("business_id", businessId);
            if (leadUpdateError) {
              console.error("Failed to update captured lead:", leadUpdateError);
              persistenceFailed = true;
            } else {
              leadCaptured = true;
            }
          }
        } else {
          const { error: leadError } = await supabase.from("leads").insert({
            business_id: businessId,
            name: leadName,
            phone: leadInfo.phone || "",
            email: leadInfo.email || "",
            service: appointmentInfo?.service || lastUserMessage?.content || "General inquiry",
            source: leadSource,
            status: "new",
            value: 0,
            notes: `Captured automatically from website chat. Original message: ${lastUserMessage?.content || ""}`,
          });
          if (leadError) {
            console.error("Failed to create captured lead:", leadError);
            persistenceFailed = true;
          } else {
            leadCaptured = true;
          }
        }

        if (appointmentInfo) {
          const appointmentNotes = `Requested through website chat. Conversation: ${convoId || sessionId}`;
          const { data: existingAppointment, error: existingAppointmentError } = await supabase
            .from("appointments")
            .select("id, status")
            .eq("business_id", businessId)
            .eq("notes", appointmentNotes)
            .maybeSingle();

          if (existingAppointmentError) {
            console.error("Failed to check for an existing requested appointment:", existingAppointmentError);
            persistenceFailed = true;
          } else if (existingAppointment) {
            const { error: appointmentUpdateError } = await supabase
              .from("appointments")
              .update({
                customer_name: leadName,
                phone: leadInfo.phone || "",
                service: appointmentInfo.service,
                date: appointmentInfo.date,
                time: appointmentInfo.time,
                ...(["scheduled", "requested"].includes(existingAppointment.status) ? { status: "requested" } : {}),
              })
              .eq("id", existingAppointment.id)
              .eq("business_id", businessId);
            if (appointmentUpdateError) {
              console.error("Failed to update requested appointment:", appointmentUpdateError);
              persistenceFailed = true;
            } else {
              appointmentCreated = true;
            }
          } else {
            const { error: appointmentError } = await supabase.from("appointments").insert({
              business_id: businessId,
              customer_name: leadName,
              phone: leadInfo.phone || "",
              service: appointmentInfo.service,
              date: appointmentInfo.date,
              time: appointmentInfo.time,
              status: "requested",
              notes: appointmentNotes,
            });
            if (appointmentError) {
              console.error("Failed to create requested appointment:", appointmentError);
              persistenceFailed = true;
            } else {
              appointmentCreated = true;
            }
          }
        }
      } else if (appointmentInfo || leadInfo.email || leadInfo.phone) {
        persistenceFailed = true;
        console.error("Lead capture is unavailable because the business ID is not configured.");
      }
    }

    aiReply = buildFinalChatReply({
      generatedReply: aiReply,
      leadName: leadInfo.name,
      appointmentInfo,
      appointmentSaved: appointmentCreated,
      leadSaved: leadCaptured,
      persistenceFailed,
      hasContact: Boolean(leadInfo.email || leadInfo.phone),
    });

    // Save the final reply so stored chat history matches what the visitor saw.
    if (convoId) {
      const { error: replyError } = await supabase.from("chat_messages").insert({
        conversation_id: convoId,
        sender: "ai",
        text: aiReply,
      });
      if (replyError) console.error("Failed to save AI reply:", replyError);
    }

    return new Response(
      JSON.stringify({ reply: aiReply, conversationId: convoId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const trimmedMessage = lower.trim();
  const hasEmailOrPhone = Boolean(
    (lower.includes("@") && lower.includes(".")) || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(lower),
  );

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!.?]*$/.test(trimmedMessage)) {
    return "Hi there! I'm WorkforceAI's website assistant. I can explain our AI tools, help you request a demo, or connect you with our team. What would you like to know?";
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return "Our pricing page lists Starter at $49/month, Professional at $149/month, and custom Enterprise pricing. Plan sign-up is marked “Coming soon,” while the site also advertises getting started free during rollout; our team can confirm what is currently available.";
  }

  if (lower.includes("demo") || lower.includes("trial") || lower.includes("try")) {
    return "You can request a live demo or a free AI audit from the website. If you'd like the team to follow up, what's the best email or phone number to reach you?";
  }

  if (lower.includes("appointment assistant") || lower.includes("appointment support")) {
    return "The AI Appointment Assistant supports appointment requests, confirmations, reminders, and rescheduling. Real availability requires a connected calendar; this website chat can't access a live calendar or confirm appointments.";
  }

  if (lower.includes("appointment") || lower.includes("schedule") || lower.includes("book")) {
    if (hasEmailOrPhone) {
      return "I have your contact details in this chat, but I can't check live calendar availability or confirm a booking. The team will need to confirm your requested time.";
    }
    return "I can collect your preferred day and time, but I don't have access to a live calendar and can't confirm a booking. Please share your contact details and preference so the team can follow up.";
  }

  if (lower.includes("sales") || lower.includes("follow-up") || lower.includes("follow up")) {
    return "WorkforceAI's AI Sales Assistant can follow up with new leads, answer common questions using a business's knowledge base, and help qualify prospects. Would you like details about the AI Receptionist or another tool?";
  }

  if (lower.includes("marketing") || lower.includes("review")) {
    return "WorkforceAI includes AI tools for marketing and review requests, alongside its Receptionist, Sales, and Appointment assistants. If you tell me what your business needs help with, I can point you to the most relevant option.";
  }

  if (/\b(hours|service area|business location|service price|quote)\b/.test(lower)) {
    return "I don't have a specific service business's hours, service area, or quote details in this chat. WorkforceAI can use a business's own knowledge base to answer those questions; our team can help you see how that works.";
  }

  if ((lower.includes("phone") || lower.includes("call")) && /\b(connect|integrat|support|answer|line|system)\w*/.test(lower)) {
    return "WorkforceAI starts with website chat, and phone connections can be added when a business is ready. I can't see whether a particular business has connected its phone line; the team can help confirm that.";
  }

  if (lower.includes("service") || lower.includes("what do you do") || lower.includes("help") || lower.includes("how does") || lower.includes("how it work")) {
    return "WorkforceAI provides AI tools for local service businesses to respond to website inquiries, capture leads, support appointment requests, follow up with prospects, and request reviews. The AI Receptionist is the starting point; would you like details about a specific tool?";
  }

  if (hasEmailOrPhone) {
    return "Thanks for sharing your contact details. What would you like help with?";
  }

  return "I can help explain WorkforceAI's tools, pricing, or demo options. What would you like to know?";
}
