import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Award, MessageCircle, UserX, Heart, Briefcase, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppState } from '@/context/AppContext';

interface Message {
  id: string;
  sender: 'user' | 'partner' | 'system';
  text: string;
}

interface GradeResult {
  overallGrade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  rewriteExample: string;
}

interface Scenario {
  id: string;
  label: string;
  desc: string;
  backstory: string;
  icon: typeof UserX;
  attachmentStyle: string;
  opener: string;
  minRounds: number;
}

const scenarios: Scenario[] = [
  {
    id: 'avoidant-ex',
    label: 'Your Avoidant Ex Wants to "Talk"',
    desc: 'After 3 months of no contact, your dismissive-avoidant ex texted at 11pm saying they miss you. You\'re at coffee now.',
    backstory: 'You dated for 2 years. They broke up with you because they "needed space" but never really explained why. They\'d go cold for days, dismiss your feelings as "too much," and make you feel crazy for wanting basic communication. You\'ve been healing. They texted last night. You agreed to meet. You\'re sitting across from them now.',
    icon: UserX,
    attachmentStyle: 'dismissive-avoidant',
    opener: "So… thanks for coming. I know this is weird. *fidgets with coffee cup* I just… I've been thinking. About stuff. About us, I guess. I don't really know why I texted you, honestly. I just felt like I should.",
    minRounds: 6,
  },
  {
    id: 'anxious-partner',
    label: 'Your Anxious Partner Is Spiraling',
    desc: 'Your partner of 8 months is upset because you went out and didn\'t text back for 3 hours',
    backstory: 'You went to a friend\'s birthday party last night. Your phone died around 10pm and you got home at 1am. Your partner called 6 times and sent 14 texts, escalating from "having fun?" to "I can\'t believe you\'re doing this to me" to "are you with someone else?" It\'s the next morning. They barely slept. You\'re having coffee together and they\'re visibly upset.',
    icon: Heart,
    attachmentStyle: 'anxious-preoccupied',
    opener: "I didn't sleep. Like, at all. I was up until 1am calling you and you just — nothing. Not a single text. Do you know what that's like? I was literally about to call hospitals. But sure, you were just at a 'party.' Must have been a great time while I was here losing my mind.",
    minRounds: 6,
  },
  {
    id: 'fearful-boss',
    label: 'Confronting Your Hot-and-Cold Boss',
    desc: 'Your boss praised your work publicly then threw you under the bus in a meeting the next day',
    backstory: 'Your manager is unpredictable. Last Monday they told the whole team your proposal was "brilliant" and they were "so lucky to have you." On Wednesday, when the VP asked a tough question about the proposal, your boss said "that was actually [your name]\'s section, I had some concerns about it myself." Now you\'re in their office for a 1-on-1. They seem to have no idea anything is wrong.',
    icon: Briefcase,
    attachmentStyle: 'fearful-avoidant',
    opener: "Hey! Come in, sit down. So I wanted to check in — I feel like we've been doing great work lately. The VP loved the direction of that proposal. I think we make a really good team. Anyway, what did you want to talk about?",
    minRounds: 6,
  },
  {
    id: 'secure-friend',
    label: 'Setting Boundaries with a Close Friend',
    desc: 'Your friend keeps crossing boundaries and you need to have a direct conversation about it',
    backstory: 'Your close friend of 5 years has been showing up unannounced, sharing your personal stories with others, and guilt-tripping you when you can\'t hang out. Last week they told your whole friend group about your breakup before you were ready. When you brought it up they said "I was just worried about you." You\'ve asked to talk.',
    icon: Shield,
    attachmentStyle: 'secure',
    opener: "Hey! What's up? You said you wanted to talk about something? Is everything okay? I've been worried about you lately, honestly. After the whole breakup thing I just want to make sure you're doing alright.",
    minRounds: 6,
  },
];

const PracticeChat = () => {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundCount, setRoundCount] = useState(0);
  const [showEndOption, setShowEndOption] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scenario = scenarios.find(s => s.id === scenarioId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (scenarioId && !loading && !grading) {
      inputRef.current?.focus();
    }
  }, [scenarioId, loading, grading, messages]);

  const startScenario = (id: string) => {
    const s = scenarios.find(s => s.id === id)!;
    setScenarioId(id);
    setRoundCount(0);
    setShowEndOption(false);
    setGrade(null);
    setError(null);
    setInput('');
    setMessages([
      { id: '0', sender: 'system', text: s.backstory },
      { id: '1', sender: 'partner', text: s.opener },
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !scenario || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    const newRound = roundCount + 1;
    setRoundCount(newRound);

    try {
      const chatHistory = newMessages
        .filter(m => m.sender !== 'system')
        .map(m => ({ sender: m.sender, text: m.text }));

      const { data, error: fnError } = await supabase.functions.invoke('practice-chat', {
        body: {
          scenario: scenario.label,
          attachmentStyle: scenario.attachmentStyle,
          backstory: scenario.backstory,
          messages: chatHistory,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        if (data.error.includes('Rate limit')) toast.error('Too many messages — slow down a bit.');
        else if (data.error.includes('credits')) toast.error('AI credits exhausted.');
        throw new Error(data.error);
      }

      const partnerMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'partner',
        text: data.reply,
      };
      setMessages(prev => [...prev, partnerMsg]);

      if (newRound >= scenario.minRounds) {
        setShowEndOption(true);
      }
    } catch (e: any) {
      console.error('Practice chat error:', e);
      setError('Failed to get a response. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const endAndGrade = async () => {
    setGrading(true);
    setShowEndOption(false);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('grade-conversation', {
        body: {
          scenario: `${scenario?.label}: ${scenario?.desc}. Backstory: ${scenario?.backstory}. The partner's attachment style is: ${scenario?.attachmentStyle}`,
          messages: messages
            .filter(m => m.sender !== 'system')
            .map(m => ({ sender: m.sender, text: m.text })),
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setGrade(data as GradeResult);
    } catch (e: any) {
      console.error('Grading failed:', e);
      setError('Could not get AI feedback. Please try again.');
      setShowEndOption(true);
    } finally {
      setGrading(false);
    }
  };

  // --- Scenario Selection ---
  if (!scenarioId) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
        <motion.div className="w-full max-w-lg space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate('/coach')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Practice Chat</h1>
            <p className="text-muted-foreground text-sm">Choose a scenario — then type freely. The AI will respond in character.</p>
          </div>
          <div className="space-y-3">
            {scenarios.map(s => {
              const styleLabel = s.attachmentStyle === 'dismissive-avoidant' ? '🧊 Dismissive-Avoidant'
                : s.attachmentStyle === 'anxious-preoccupied' ? '🔥 Anxious-Preoccupied'
                : s.attachmentStyle === 'fearful-avoidant' ? '🌪️ Fearful-Avoidant'
                : '🌿 Secure';
              return (
                <button
                  key={s.id}
                  onClick={() => startScenario(s.id)}
                  className="w-full bg-card rounded-xl p-5 shadow-soft text-left flex items-start gap-4 hover:shadow-glow transition-shadow"
                >
                  <div className="w-10 h-10 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0 mt-0.5">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{s.label}</p>
                    <p className="text-xs text-primary/70 font-medium mt-0.5">{styleLabel}</p>
                    <p className="text-sm text-muted-foreground leading-snug mt-1">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Grade Result ---
  if (grade) {
    const gradeColor = grade.overallGrade.startsWith('A') ? 'text-green-500' : grade.overallGrade.startsWith('B') ? 'text-primary' : 'text-orange-500';
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
        <motion.div className="w-full max-w-lg space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-card shadow-glow flex items-center justify-center mx-auto">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <p className={`text-5xl font-black ${gradeColor}`}>{grade.overallGrade}</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{grade.summary}</p>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-soft space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-green-600 mb-2">✅ Strengths</h3>
              <ul className="space-y-1.5">
                {grade.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-orange-500 mb-2">💡 Areas to Improve</h3>
              <ul className="space-y-1.5">
                {grade.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-primary mb-2">✍️ Better Way to Say It</h3>
              <p className="text-sm text-foreground bg-muted rounded-lg p-3 italic">"{grade.rewriteExample}"</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => startScenario(scenarioId!)}
              className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => { setScenarioId(null); setMessages([]); setGrade(null); }}
              className="flex-1 py-3 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity"
            >
              New Scenario
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Chat Screen ---
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex items-center gap-3">
        <button onClick={() => { setScenarioId(null); setMessages([]); setRoundCount(0); }} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-sm">{scenario?.label}</p>
          <p className="text-xs text-muted-foreground">
            {scenario?.attachmentStyle.replace('-', ' ')} • {roundCount} exchange{roundCount !== 1 ? 's' : ''}
          </p>
        </div>
        {showEndOption && !grading && (
          <button
            onClick={endAndGrade}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            End & Grade
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.sender === 'user' ? 'gradient-hero text-primary-foreground rounded-br-md' :
                msg.sender === 'system' ? 'bg-sage-light text-foreground border border-primary/20 rounded-bl-md' :
                'bg-card text-foreground border border-border rounded-bl-md'
              }`}>
                {msg.sender === 'partner' && (
                  <span className="text-xs font-semibold block mb-1 text-secondary">💬 Them</span>
                )}
                {msg.sender === 'system' && (
                  <span className="text-xs font-semibold block mb-1 text-primary">📖 Context</span>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">typing…</span>
            </div>
          </motion.div>
        )}

        {grading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-6">
            <div className="flex items-center gap-3 bg-card rounded-xl px-5 py-3 shadow-soft">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">AI is grading your conversation…</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
            <div className="bg-destructive/10 text-destructive rounded-xl px-5 py-3 text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline font-medium">Dismiss</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {!grading && !grade && (
        <div className="border-t border-border bg-card p-3">
          {showEndOption && (
            <p className="text-xs text-center text-muted-foreground mb-2">
              You can keep chatting or tap "End & Grade" to get feedback
            </p>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your response…"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeChat;
