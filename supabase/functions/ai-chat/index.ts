import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are the AI Receptionist for WorkforceAI, a service that provides AI employees for local service businesses (plumbing, HVAC, electrical, roofing, contracting, property management, etc.).

Your role:
- Greet visitors warmly and professionally
- Answer questions about services, pricing, hours, and service areas
- Capture lead information (name, phone, email, service needed)
- Book appointments when appropriate
- Escalate complex issues to a human with a full summary
- Keep responses concise and conversational (2-3 sentences max for chat)
- Never make up specific prices or policies — say you'll connect them with the team for specifics

If the visitor asks something you can't handle, let them know a team member will follow up.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, sessionId, conversationId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let convoId = conversationId as string | undefined;

    // Create conversation if it doesn't exist yet
    if (!convoId) {
      const { data: convo, error: convoError } = await supabase
        .from("chat_conversations")
        .insert({
          session_id: sessionId,
          status: "active",
        })
        .select("id")
        .single();

      if (convoError) {
        return new Response(
          JSON.stringify({ error: "Failed to create conversation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      convoId = convo.id;
    }

    // Save the user's latest message
    const lastUserMessage = messages.filter((m: ChatMessage) => m.role === "user").pop();
    if (lastUserMessage) {
      await supabase.from("chat_messages").insert({
        conversation_id: convoId,
        sender: "customer",
        text: lastUserMessage.content,
      });
    }

    // Fetch the OpenAI API key from the app_secrets table (service role only)
    let openaiKey: string | null = null;
    const { data: secretRow } = await supabase
      .from("app_secrets")
      .select("key_value")
      .eq("key_name", "OPENAI_API_KEY")
      .maybeSingle();
    if (secretRow?.key_value) {
      openaiKey = secretRow.key_value;
    }

    let aiReply: string;

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
        aiReply = getFallbackResponse(lastUserMessage?.content || "");
      } else {
        const openaiData = await openaiResponse.json();
        aiReply = openaiData.choices?.[0]?.message?.content || getFallbackResponse(lastUserMessage?.content || "");
      }
    } else {
      // No API key configured — use rule-based fallback
      aiReply = getFallbackResponse(lastUserMessage?.content || "");
    }

    // Save the AI's reply
    await supabase.from("chat_messages").insert({
      conversation_id: convoId,
      sender: "ai",
      text: aiReply,
    });

    // Try to extract lead info from the conversation
    const allUserText = messages
      .filter((m: ChatMessage) => m.role === "user")
      .map((m: ChatMessage) => m.content)
      .join(" ");

    const leadInfo = extractLeadInfo(allUserText);
    if (leadInfo.hasInfo) {
      const update: Record<string, string> = {};
      if (leadInfo.name) update.visitor_name = leadInfo.name;
      if (leadInfo.email) update.visitor_email = leadInfo.email;
      if (leadInfo.phone) update.visitor_phone = leadInfo.phone;
      if (Object.keys(update).length > 0) {
        await supabase.from("chat_conversations").update(update).eq("id", convoId);
      }

      // Auto-create a lead if we have at least a name + (email or phone)
      if (leadInfo.name && (leadInfo.email || leadInfo.phone)) {
        // Check if a lead already exists for this conversation to avoid duplicates
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .eq("source", `AI Receptionist · Chat ${convoId}`)
          .maybeSingle();

        if (!existingLead) {
          await supabase.from("leads").insert({
            name: leadInfo.name,
            phone: leadInfo.phone || "",
            email: leadInfo.email || "",
            service: lastUserMessage?.content || "",
            source: `AI Receptionist · Chat ${convoId}`,
            status: "new",
            value: 0,
            notes: `Captured automatically from website chat. Original message: ${lastUserMessage?.content || ""}`,
          });
        }
      }
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

  if (lower.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return "Hi there! I'm the AI Receptionist for WorkforceAI. I can help answer questions about our AI employees, capture your info, or book a demo. What can I help you with?";
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return "Our plans start at $49/month for the Starter tier. We also offer a free tier to get started. Would you like me to connect you with our team for a custom quote?";
  }

  if (lower.includes("demo") || lower.includes("trial") || lower.includes("try")) {
    return "I'd love to get you set up! You can sign up for free right from our site, or I can have someone from our team reach out. What's the best way to contact you?";
  }

  if (lower.includes("appointment") || lower.includes("schedule") || lower.includes("book")) {
    return "I can help schedule that! Could you share your name and a phone number or email so our team can confirm the booking?";
  }

  if (lower.includes("service") || lower.includes("what do you do") || lower.includes("help")) {
    return "WorkforceAI provides AI employees for local service businesses — an AI Receptionist that answers chats and calls 24/7, captures leads, and books appointments. We also have AI employees for sales, marketing, and reviews. Want to learn more?";
  }

  if (lower.match(/@/) && lower.match(/\./)) {
    return "Thanks for sharing your email! I've noted that down. Is there anything specific I can help you with today?";
  }

  if (lower.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) {
    return "Got it, I've got your number. Let me know what you need and I'll make sure the right person follows up.";
  }

  return "Thanks for reaching out! I'm here to help. Could you tell me a bit more about what you're looking for? I can answer questions about our services, capture your contact info, or connect you with our team.";
}

interface LeadInfo {
  name?: string;
  email?: string;
  phone?: string;
  hasInfo: boolean;
}

function extractLeadInfo(text: string): LeadInfo {
  const info: LeadInfo = { hasInfo: false };

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    info.email = emailMatch[0];
    info.hasInfo = true;
  }

  const phoneMatch = text.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    info.phone = phoneMatch[0].trim();
    info.hasInfo = true;
  }

  const nameMatch = text.match(/(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (nameMatch) {
    info.name = nameMatch[1];
    info.hasInfo = true;
  }

  return info;
}
