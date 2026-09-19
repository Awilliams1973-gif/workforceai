import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  UserCircle,
  Bot,
  Headset,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  Inbox,
} from 'lucide-react';

interface ChatMessageRow {
  id: string;
  sender: 'customer' | 'ai' | 'human';
  text: string;
  created_at: string;
}

interface ConversationRow {
  id: string;
  session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: 'active' | 'awaiting_human' | 'closed';
  created_at: string;
  updated_at: string;
  messages?: ChatMessageRow[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [humanTakeover, setHumanTakeover] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        messages:chat_messages(*)
      `)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      setError('Unable to load conversations. Please try again.');
    } else {
      const sorted = (data || []).map((c: ConversationRow) => ({
        ...c,
        messages: c.messages
          ? [...c.messages].sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          : [],
      }));
      setConversations(sorted);
      if (sorted.length > 0 && !activeId) {
        setActiveId(sorted[0].id);
      }
    }
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const active = conversations.find((c) => c.id === activeId);
  const showListMobile = !activeId;

  const takeOver = async (id: string) => {
    setHumanTakeover((p) => ({ ...p, [id]: true }));
    await supabase
      .from('chat_conversations')
      .update({ status: 'awaiting_human' })
      .eq('id', id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'awaiting_human' } : c))
    );
  };

  const sendMessage = async () => {
    if (!draft.trim() || !active || sending) return;
    setSending(true);

    const { data: newMsg } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: active.id,
        sender: 'human',
        text: draft.trim(),
      })
      .select('*')
      .single();

    if (newMsg) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === active.id
            ? { ...c, messages: [...c.messages!, newMsg], updated_at: new Date().toISOString() }
            : c
        )
      );
    }
    setDraft('');
    setSending(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 -m-4 lg:-m-6">
      {/* Conversation list */}
      <div className={(showListMobile ? 'flex ' : 'hidden ') + 'w-full flex-col border-r border-slate-200 bg-white sm:flex sm:w-80'}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Conversations</h1>
            <p className="text-xs text-slate-500">All customer chats in one inbox</p>
          </div>
          <button
            onClick={fetchConversations}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No conversations yet</h3>
              <p className="mt-1 px-6 text-xs text-slate-500">
                When visitors chat with your AI Receptionist, their conversations will appear here.
              </p>
            </div>
          ) : (
            conversations.map((convo) => {
              const lastMsg = convo.messages?.[convo.messages.length - 1];
              return (
                <button
                  key={convo.id}
                  onClick={() => setActiveId(convo.id)}
                  className={'flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 ' + (activeId === convo.id ? 'bg-teal-50' : '')}
                >
                  <div className={'mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg ' + (convo.status === 'awaiting_human' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500')}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {convo.visitor_name || 'Anonymous visitor'}
                      </p>
                      <span className="text-xs text-slate-400">{formatDate(convo.created_at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {lastMsg?.text || 'No messages'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={'badge text-[10px] ' + (
                        convo.status === 'active' ? 'bg-green-100 text-green-700' :
                        convo.status === 'awaiting_human' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {convo.status === 'awaiting_human' ? 'Needs you' : convo.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {convo.messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active conversation */}
      {active ? (
        <div className={(showListMobile ? 'hidden ' : 'flex ') + 'flex-1 flex-col bg-slate-50 sm:flex'}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                <UserCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {active.visitor_name || 'Anonymous visitor'}
                </p>
                <p className="text-xs text-slate-500">
                  {active.visitor_email || 'No email captured'}
                  {active.visitor_phone ? ' · ' + active.visitor_phone : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {humanTakeover[active.id] ? (
                <span className="badge bg-blue-100 text-blue-700">
                  <UserCircle className="h-3 w-3" />
                  You're handling this
                </span>
              ) : (
                <button onClick={() => takeOver(active.id)} className="btn-primary text-xs">
                  <Headset className="h-3.5 w-3.5" />
                  Human Takeover
                </button>
              )}
            </div>
          </div>

          {/* AI actions summary */}
          <div className="border-b border-slate-200 bg-teal-50 px-5 py-2.5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-teal-700">
              <span className="inline-flex items-center gap-1.5 font-medium"><Bot className="h-3.5 w-3.5" /> AI actions:</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {active.messages?.length || 0} messages</span>
              {active.visitor_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> Email captured</span>}
              {active.visitor_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> Phone captured</span>}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {active.messages?.map((msg) => (
              <div key={msg.id} className={'flex ' + (msg.sender === 'customer' ? 'justify-start' : 'justify-end')}>
                <div className={'flex items-end gap-2 ' + (msg.sender === 'customer' ? 'flex-row' : 'flex-row-reverse')}>
                  {msg.sender === 'ai' ? (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : msg.sender === 'human' ? (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <UserCircle className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                      <UserCircle className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <div className={'max-w-md rounded-2xl px-4 py-2.5 text-sm ' + (
                      msg.sender === 'customer' ? 'rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200' :
                      msg.sender === 'ai' ? 'rounded-br-sm bg-teal-600 text-white' :
                      'rounded-br-sm bg-blue-600 text-white'
                    )}>
                      {msg.text}
                    </div>
                    <p className={'mt-1 text-xs text-slate-400 ' + (msg.sender === 'customer' ? 'text-left' : 'text-right')}>
                      {msg.sender === 'ai' ? 'AI Receptionist' : msg.sender === 'human' ? 'You' : 'Customer'} · {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {active.messages?.length === 0 && (
              <div className="flex items-center justify-center py-12 text-center">
                <Clock className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No messages in this conversation</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-4">
            {humanTakeover[active.id] ? (
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder="Type a message as the business..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={sending}
                />
                <button onClick={sendMessage} disabled={sending || !draft.trim()} className="btn-primary">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  <Bot className="mr-1.5 inline h-4 w-4 text-teal-600" />
                  AI is handling this conversation
                </p>
                <button onClick={() => takeOver(active.id)} className="btn-primary text-xs">
                  Take over
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center bg-slate-50 sm:flex">
          <div className="text-center">
            <Clock className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}
