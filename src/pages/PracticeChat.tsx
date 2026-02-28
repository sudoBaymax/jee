import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, UserX, Heart, Briefcase } from 'lucide-react';
import { ChatMessage } from '@/context/AppContext';

const scenarios = [
  { id: 'avoidant-ex', label: 'Avoidant Ex', desc: 'Distant, vague, pulls away', icon: UserX },
  { id: 'anxious-partner', label: 'Anxious Partner', desc: 'Needs reassurance constantly', icon: Heart },
  { id: 'work-conflict', label: 'Work Conflict', desc: 'Neutral, direct, professional', icon: Briefcase },
];

const quickInserts = [
  'I hear you, and I also need…',
  'Can we pause and revisit this later?',
  'I feel [emotion] when [situation]. What I need is…',
  'I care about this, and my boundary is…',
];

function getPartnerReply(scenario: string, userMsg: string): string {
  const lower = userMsg.toLowerCase();
  if (scenario === 'avoidant-ex') {
    if (lower.includes('feel') || lower.includes('need')) return "I don't know… I just need some space right now. Can we not do this?";
    if (lower.includes('boundary') || lower.includes('limit')) return "Okay. Sure. Whatever you need.";
    if (lower.includes('pause') || lower.includes('break')) return "Yeah… I think that's for the best.";
    return "I guess. I don't really want to get into it though.";
  }
  if (scenario === 'anxious-partner') {
    if (lower.includes('space') || lower.includes('pause')) return "Wait, are you pulling away from me? Did I do something wrong? Please don't leave...";
    if (lower.includes('feel') || lower.includes('need')) return "I hear that, but I'm scared you're going to give up on us. Can you just reassure me?";
    if (lower.includes('boundary')) return "A boundary? Does that mean you don't want to be with me anymore?";
    return "I just need to know we're okay. Are we okay? Please tell me we're okay.";
  }
  // work
  if (lower.includes('feel') || lower.includes('need')) return "I appreciate you sharing that. Let's focus on finding a solution that works for both of us.";
  if (lower.includes('boundary') || lower.includes('limit')) return "Understood. Let's document this so we're aligned going forward.";
  return "Let's schedule a follow-up to discuss this properly. What time works for you?";
}

function getCoachFeedback(userMsg: string): string {
  const lower = userMsg.toLowerCase();
  const has = (w: string) => lower.includes(w);

  if (has('feel') && has('need')) return "✨ Great — you named a feeling AND a need. That's secure communication.";
  if (has('feel')) return "👍 Good start naming your feeling. Try adding what you need: 'I feel X, and what I need is Y.'";
  if (has('need') || has('request')) return "👍 Clear request. Try leading with how you feel first to add context.";
  if (has('boundary') || has('limit')) return "🛡️ Nice boundary! Make sure to pair it with care: 'I value this, AND my boundary is…'";
  if (has('pause') || has('break') || has('space')) return "⏸️ Great self-regulation! Taking a pause is a secure move.";
  if (has('sorry') && lower.length < 30) return "💡 'Sorry' alone can be a filler. Try: 'I want to own my part. What I did was [X], and I'll [Y] differently.'";
  if (lower.length < 15) return "💡 Try adding more substance. Use the formula: feeling + need + request.";
  return "💬 Decent message. To level up: name a specific feeling, state your need, and make one clear request.";
}

const PracticeChat = () => {
  const [scenario, setScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const startScenario = (id: string) => {
    setScenario(id);
    const s = scenarios.find(s => s.id === id)!;
    setMessages([{
      id: '0', sender: 'coach', timestamp: new Date(),
      text: `You're now practicing with: **${s.label}** — ${s.desc}. Try communicating securely. Use feelings, needs, and clear requests.`,
    }]);
  };

  const sendMessage = () => {
    if (!input.trim() || !scenario) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    const coachMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'coach', text: getCoachFeedback(input), timestamp: new Date() };
    const partnerMsg: ChatMessage = { id: (Date.now() + 2).toString(), sender: 'partner', text: getPartnerReply(scenario, input), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg, coachMsg, partnerMsg]);
    setInput('');
  };

  if (!scenario) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
        <motion.div className="w-full max-w-lg space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate('/coach')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Practice Chat</h1>
            <p className="text-muted-foreground text-sm">Choose a scenario to practice secure communication</p>
          </div>
          <div className="space-y-3">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => startScenario(s.id)}
                className="w-full bg-card rounded-xl p-5 shadow-soft text-left flex items-center gap-4 hover:shadow-glow transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-sage-light flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex items-center gap-3">
        <button onClick={() => { setScenario(null); setMessages([]); }} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-semibold text-sm">{scenarios.find(s => s.id === scenario)?.label}</p>
          <p className="text-xs text-muted-foreground">Practice Mode</p>
        </div>
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
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.sender === 'user' ? 'gradient-hero text-primary-foreground rounded-br-md' :
                msg.sender === 'coach' ? 'bg-sage-light text-foreground border border-primary/20 rounded-bl-md' :
                'bg-card text-foreground border border-border rounded-bl-md'
              }`}>
                {msg.sender !== 'user' && (
                  <span className={`text-xs font-semibold block mb-1 ${msg.sender === 'coach' ? 'text-primary' : 'text-secondary'}`}>
                    {msg.sender === 'coach' ? '🧭 Coach' : '💬 Partner'}
                  </span>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick inserts */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto">
        {quickInserts.map((q, i) => (
          <button
            key={i}
            onClick={() => setInput(q)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-sage-light text-primary text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors flex-shrink-0"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />{q.slice(0, 30)}{q.length > 30 ? '…' : ''}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your response..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
          <button onClick={sendMessage} className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow hover:opacity-90 transition-opacity">
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeChat;
