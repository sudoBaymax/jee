import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  sender: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  session_code: string;
  person1_name: string;
  person1_attachment: string;
  person2_name: string | null;
  person2_attachment: string | null;
  situation: string | null;
  ai_mode: string;
  person1_spoke: boolean;
  person2_spoke: boolean;
}

const CouplesChat = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const role = localStorage.getItem('couples_role') || 'person1';
  const myName = localStorage.getItem('couples_name') || 'Unknown';
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load session
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('session_code', code)
        .maybeSingle();
      if (data) setSession(data as Session);
      else toast.error('Session not found');
    };
    load();
  }, [code]);

  // Load messages & subscribe to realtime
  useEffect(() => {
    if (!session) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from('couples_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    loadMessages();

    const channel = supabase
      .channel(`couples-${session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'couples_messages', filter: `session_id=eq.${session.id}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couples_sessions', filter: `id=eq.${session.id}` }, (payload) => {
        setSession(payload.new as Session);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || !session) return;
    const text = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic update - show message immediately
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      sender: role,
      sender_name: myName,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Insert message
    const { data: inserted } = await supabase.from('couples_messages').insert({
      session_id: session.id,
      sender: role,
      sender_name: myName,
      content: text,
    }).select().single();

    // Replace optimistic message with real one
    if (inserted) {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? (inserted as Message) : m));
    }

    // Update spoke flag
    await supabase.from('couples_sessions').update({
      [`${role}_spoke`]: true,
    }).eq('id', session.id);

    setLoading(false);

    // Check if AI should respond
    if (session.ai_mode === 'after_both') {
      // Refresh session to check flags
      const { data: updated } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('id', session.id)
        .maybeSingle();
      if (updated) {
        const s = updated as Session;
        const otherSpoke = role === 'person1' ? s.person2_spoke : s.person1_spoke;
        if (otherSpoke) {
          await requestTherapist();
          // Reset spoke flags
          await supabase.from('couples_sessions').update({
            person1_spoke: false,
            person2_spoke: false,
          }).eq('id', session.id);
        }
      }
    }
  };

  const requestTherapist = async () => {
    if (!session) return;
    setAiStreaming(true);
    setStreamingContent('');

    // Get all messages for context
    const { data: allMsgs } = await supabase
      .from('couples_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    const chatHistory = (allMsgs || []).map((m: Message) => ({
      role: m.sender === 'therapist' ? 'assistant' : 'user',
      content: m.sender === 'therapist' ? m.content : `[${m.sender_name}]: ${m.content}`,
    }));

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/couples-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: chatHistory,
          person1_name: session.person1_name,
          person1_attachment: session.person1_attachment,
          person2_name: session.person2_name || 'Person 2',
          person2_attachment: session.person2_attachment || 'unknown',
          situation: session.situation,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || 'AI error');
        setAiStreaming(false);
        return;
      }

      // Stream response
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save therapist message
      if (fullContent) {
        await supabase.from('couples_messages').insert({
          session_id: session.id,
          sender: 'therapist',
          sender_name: 'Therapist',
          content: fullContent,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to get therapist response');
    }

    setAiStreaming(false);
    setStreamingContent('');
  };

  const getSenderColor = (sender: string) => {
    if (sender === 'therapist') return 'bg-primary/15 border-primary/30';
    if (sender === 'person1') return 'bg-secondary/15 border-secondary/30';
    return 'bg-accent/15 border-accent/30';
  };

  const getSenderLabel = (sender: string) => {
    if (sender === 'therapist') return '🧠 Therapist';
    if (sender === 'person1') return session?.person1_name || 'Person 1';
    return session?.person2_name || 'Person 2';
  };

  const isMe = (sender: string) => sender === role;

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const partnerJoined = !!session.person2_name;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/couples')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">Couples Session</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{session.person1_name}</span>
              <span>+</span>
              <span>{session.person2_name || 'Waiting...'}</span>
              <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-[10px]">{session.session_code}</span>
            </div>
          </div>
          {session.ai_mode === 'on_request' && (
            <button
              onClick={requestTherapist}
              disabled={aiStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              Ask Therapist
            </button>
          )}
        </div>
      </header>

      {/* Waiting state */}
      {!partnerJoined && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center animate-pulse-soft">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Waiting for your partner to join...</p>
            <p className="text-sm text-muted-foreground">Share code: <span className="font-bold text-foreground">{session.session_code}</span></p>
          </div>
        </div>
      )}

      {/* Messages */}
      {partnerJoined && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
            {/* Situation banner */}
            {session.situation && (
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Topic</p>
                <p className="text-sm text-foreground">{session.situation}</p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe(msg.sender) ? 'justify-end' : 'justify-start'} ${msg.sender === 'therapist' ? 'justify-center' : ''}`}
                >
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 border ${getSenderColor(msg.sender)} ${msg.sender === 'therapist' ? 'max-w-[95%]' : ''}`}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{getSenderLabel(msg.sender)}</p>
                    {msg.sender === 'therapist' ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming therapist response */}
            {aiStreaming && streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="max-w-[95%] rounded-xl px-4 py-3 border bg-primary/15 border-primary/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">🧠 Therapist</p>
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {aiStreaming && !streamingContent && (
              <div className="flex justify-center">
                <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm animate-pulse-soft">
                  Therapist is thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="sticky bottom-0 bg-card/80 backdrop-blur-sm border-t border-border px-4 py-3">
            <div className="max-w-2xl mx-auto flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Message as ${myName}...`}
                className="flex-1 p-3 rounded-xl border-2 border-border bg-background text-foreground focus:border-primary outline-none transition-colors"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 rounded-xl gradient-hero text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CouplesChat;
