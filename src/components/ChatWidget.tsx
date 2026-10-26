import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, UserCircle, Sparkles } from 'lucide-react';
import TurnstileWidget from '@/components/TurnstileWidget';

interface ChatMsg {
  id: string;
  sender: 'customer' | 'ai';
  text: string;
}

const GREETING = "Hi there! I'm WorkforceAI's AI Receptionist. I can explain our AI tools, help you request a demo or free AI audit, and connect you with our team. What would you like to know?";
const receptionistAvailable = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const turnstileEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'greeting', sender: 'ai', text: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [unread, setUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setUnread(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const sendMessage = async () => {
    if (!receptionistAvailable) {
      const errMsg: ChatMsg = {
        id: `e${Date.now()}`,
        sender: 'ai',
        text: 'The AI receptionist is currently unavailable because the Supabase configuration is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live chat.',
      };
      setMessages((prev) => [...prev, errMsg]);
      return;
    }

    if (!turnstileEnabled) {
      return;
    }

    const text = input.trim();
    if (!text || loading) return;

    if (turnstileEnabled && !turnstileToken) {
      setVerificationStarted(true);
      return;
    }

    const userMsg: ChatMsg = {
      id: `u${Date.now()}`,
      sender: 'customer',
      text,
    };
    const verifiedToken = turnstileToken;
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTurnstileToken(null);
    setVerificationStarted(false);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }

      const allMessages = messages
        .filter((m) => m.id !== 'greeting')
        .map((m) => ({
          role: m.sender === 'customer' ? 'user' : 'assistant',
          content: m.text,
        }))
        .concat([{ role: 'user' as const, content: text }]);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: allMessages,
          sessionId,
          conversationId,
          turnstileToken: verifiedToken,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || `Request failed (${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMsg: ChatMsg = {
        id: `a${Date.now()}`,
        sender: 'ai',
        text: data.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (!open) {
        setUnread(true);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown connection error';
      console.error('AI Receptionist request failed:', detail);
      const verificationFailed = detail === 'Verification failed. Please try again.';
      if (verificationFailed) setVerificationStarted(true);
      const errMsg: ChatMsg = {
        id: `e${Date.now()}`,
        sender: 'ai',
        text: verificationFailed
          ? 'The security check could not be verified. Please complete it again and resend your message.'
          : 'I’m having trouble connecting right now. Please try again in a moment, or contact the WorkforceAI team directly.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && receptionistAvailable && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-all duration-200 hover:bg-teal-700 hover:shadow-xl active:scale-95"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
          {unread && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              1
            </span>
          )}
        </button>
      )}

      {!receptionistAvailable && (
        <div className="fixed bottom-5 right-5 z-50 max-w-xs rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg">
          AI receptionist is currently unavailable. Add the Supabase environment variables to enable live chat.
        </div>
      )}

      {open && receptionistAvailable && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-teal-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Receptionist</p>
                <p className="flex items-center gap-1 text-xs text-teal-100">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-teal-100 transition-colors hover:bg-teal-500 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 ${msg.sender === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.sender === 'ai' ? (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                      <UserCircle className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.sender === 'customer'
                        ? 'rounded-br-sm bg-teal-600 text-white'
                        : 'rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 ring-1 ring-slate-200">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-3">
            {!turnstileEnabled && (
              <p role="alert" className="mb-2 text-xs text-red-700">
                Chat security verification is unavailable. Please contact the WorkforceAI team.
              </p>
            )}
            {import.meta.env.VITE_TURNSTILE_SITE_KEY && !verificationStarted && (
              <button type="button" onClick={() => setVerificationStarted(true)} className="mb-2 w-full rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100">
                Verify before sending
              </button>
            )}
            {turnstileEnabled && verificationStarted && <TurnstileWidget onToken={setTurnstileToken} />}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading || !turnstileEnabled}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !turnstileEnabled}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition-all hover:bg-teal-700 active:scale-95 disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <Sparkles className="h-3 w-3" />
              Powered by WorkforceAI
            </p>
          </div>
        </div>
      )}
    </>
  );
}
