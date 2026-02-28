import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, UserX, Heart, Briefcase, Loader2, Award, ChevronRight, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const scenarios = [
  {
    id: 'avoidant-ex',
    label: 'Avoidant Ex',
    desc: 'Distant, vague, pulls away',
    icon: UserX,
    opener: "Hey. So… I know you wanted to talk, but honestly I don't really see the point. We've been through this. I just think it's better if we keep our distance.",
    responseOptions: [
      "I hear you, and I respect that you need space. I also need to share something important with me — can I have a moment?",
      "Fine. Whatever you want.",
      "You always do this! Every time I try to talk, you shut down.",
      "I feel hurt when we can't talk things through. What I need is just 5 minutes — can we try that?",
    ],
    partnerReplies: {
      0: "…Okay. I guess you can talk. Just… don't make it a whole thing.",
      1: "Okay then.",
      2: "See, this is exactly why I don't want to talk. You always make it about blame.",
      3: "Five minutes? I… yeah, okay. I can do five minutes.",
    } as Record<number, string>,
    followUpOptions: [
      "I feel anxious when there's distance between us, and what I need is to know we can still communicate even when it's hard.",
      "Look, I just need you to stop pulling away. It's not fair.",
      "I care about you AND I have a boundary — I need us to check in at least once a week. Does that work?",
      "Never mind, forget I said anything.",
    ],
    followUpReplies: {
      0: "I… didn't know you felt anxious about it. I'm not trying to disappear. I just need to process things alone sometimes.",
      1: "I'm not pulling away on purpose. But when you say it like that, I just want to shut down more.",
      2: "Once a week? I think I could try that. No promises but… I'll try.",
      3: "…okay. If that's what you want.",
    } as Record<number, string>,
  },
  {
    id: 'anxious-partner',
    label: 'Anxious Partner',
    desc: 'Needs reassurance constantly',
    icon: Heart,
    opener: "You didn't text me back for 3 hours. Are we okay? Did I do something wrong? I feel like you're slipping away from me and I can't handle it.",
    responseOptions: [
      "I'm sorry I worried you. I was busy, but I'm here now. We're okay.",
      "I feel overwhelmed when I get multiple worried texts. I care about you AND I need some breathing room during work hours.",
      "You need to stop being so clingy. It's exhausting.",
      "I understand you felt scared. What would help you feel more secure when I can't respond right away?",
    ],
    partnerReplies: {
      0: "Okay… but can you just tell me when you're going to be busy? So I don't spiral?",
      1: "Breathing room? Does that mean you don't want to hear from me? I knew it…",
      2: "Clingy? I'm not clingy, I just love you! Why would you say that?",
      3: "I… I don't know. Maybe if you sent a quick emoji or something? So I know you're not ignoring me?",
    } as Record<number, string>,
    followUpOptions: [
      "I can do that — a quick heads-up text. And when I don't reply instantly, it doesn't mean anything is wrong. Can you try to trust that?",
      "I feel caring toward you AND I need to set a boundary: I won't respond to 'are we okay?' texts during work. I'll always reply after.",
      "Fine, I'll text you every hour if that's what it takes.",
      "Maybe we should take a break if this is so stressful for you.",
    ],
    followUpReplies: {
      0: "I can try. It's just hard because my brain goes to the worst place. But I'll work on it. Thank you for being patient.",
      1: "That feels scary but… I guess that's fair. As long as you do reply after. I can try.",
      2: "Every hour? No, that's not what I meant. I just wanted to know you care. Now I feel guilty.",
      3: "A break?! No! Please, I don't want a break. I'm sorry, I'll stop texting so much. Please don't leave.",
    } as Record<number, string>,
  },
  {
    id: 'work-conflict',
    label: 'Work Conflict',
    desc: 'Tense project disagreement',
    icon: Briefcase,
    opener: "I saw you went ahead and changed the project timeline without consulting the team. I've been working under the original deadlines and now I'm behind. We need to discuss this.",
    responseOptions: [
      "You're right, I should have communicated that change. I apologize for the confusion — can we realign on a timeline that works for both of us?",
      "I had to make a quick call. The old timeline wasn't realistic and I didn't have time to loop everyone in.",
      "I feel frustrated that you're framing this as my fault when the original timeline was set without my input either.",
      "I hear your concern. Let me take responsibility for not communicating, and let's find a solution together. What do you need from me right now?",
    ],
    partnerReplies: {
      0: "I appreciate that. Let's schedule 30 minutes to go over the new dates. Can you send me what changed?",
      1: "I understand quick calls happen, but I needed to know. Going forward, can you at least send a heads-up?",
      2: "That's fair — the original timeline wasn't great either. Maybe we should both push back on unrealistic deadlines together.",
      3: "Honestly, I just need visibility. If things shift, a quick message in the team channel would go a long way.",
    } as Record<number, string>,
    followUpOptions: [
      "I'll commit to flagging any timeline changes in the team channel within 24 hours. Does that address your concern?",
      "I feel stressed when deadlines shift without discussion. My need is for us to make these calls together. Can we agree on that?",
      "Look, I'll try to be better about it, but no promises. Things move fast.",
      "I value our working relationship, AND my boundary is that I won't accept blame for systemic issues. Let's fix the process, not point fingers.",
    ],
    followUpReplies: {
      0: "That works for me. And if I have concerns, I'll raise them in the same channel instead of letting it build up. Deal?",
      1: "Agreed — joint decisions on timeline changes from now on. I'll hold us both to that.",
      2: "I get that things move fast, but 'no promises' isn't really a commitment. Can you meet me halfway here?",
      3: "You're right — it is a process issue. Let's bring it up in the next retro and fix it for everyone.",
    } as Record<number, string>,
  },
];

const PracticeChat = () => {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0); // 0 = first response, 1 = follow-up, 2 = done
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scenario = scenarios.find(s => s.id === scenarioId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, showCustom]);

  const startScenario = (id: string) => {
    const s = scenarios.find(s => s.id === id)!;
    setScenarioId(id);
    setStep(0);
    setGrade(null);
    setError(null);
    setMessages([
      { id: '0', sender: 'system', text: `Scenario: **${s.label}** — ${s.desc}. Respond as you would in real life.` },
      { id: '1', sender: 'partner', text: s.opener },
    ]);
  };

  const pickOption = (index: number) => {
    if (!scenario) return;
    const options = step === 0 ? scenario.responseOptions : scenario.followUpOptions;
    const replies = step === 0 ? scenario.partnerReplies : scenario.followUpReplies;

    const userText = options[index];
    const partnerText = replies[index];

    const newMsgs: Message[] = [
      ...messages,
      { id: Date.now().toString(), sender: 'user', text: userText },
      { id: (Date.now() + 1).toString(), sender: 'partner', text: partnerText },
    ];
    setMessages(newMsgs);
    setShowCustom(false);

    if (step === 0) {
      setStep(1);
    } else {
      setStep(2);
      gradeConversation(newMsgs);
    }
  };

  const sendCustom = () => {
    if (!customInput.trim() || !scenario) return;

    const replies = step === 0 ? scenario.partnerReplies : scenario.followUpReplies;
    // Pick a contextual partner reply based on keywords
    const lower = customInput.toLowerCase();
    let replyIndex = 0;
    if (lower.includes('feel') && lower.includes('need')) replyIndex = 3;
    else if (lower.includes('boundary') || lower.includes('limit')) replyIndex = 2;
    else if (lower.includes('feel') || lower.includes('care')) replyIndex = 0;
    else replyIndex = 1;

    const partnerText = replies[replyIndex] || replies[0];

    const newMsgs: Message[] = [
      ...messages,
      { id: Date.now().toString(), sender: 'user', text: customInput },
      { id: (Date.now() + 1).toString(), sender: 'partner', text: partnerText },
    ];
    setMessages(newMsgs);
    setCustomInput('');
    setShowCustom(false);

    if (step === 0) {
      setStep(1);
    } else {
      setStep(2);
      gradeConversation(newMsgs);
    }
  };

  const gradeConversation = async (allMessages: Message[]) => {
    setGrading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('grade-conversation', {
        body: {
          scenario: scenario?.label,
          messages: allMessages
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
    } finally {
      setGrading(false);
    }
  };

  // --- Scenario Selection Screen ---
  if (!scenarioId) {
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

  const currentOptions = step === 0 ? scenario?.responseOptions : scenario?.followUpOptions;
  const showOptions = step < 2 && !grading;

  // --- Grade Result Screen ---
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
        <button onClick={() => { setScenarioId(null); setMessages([]); setStep(0); }} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-semibold text-sm">{scenario?.label}</p>
          <p className="text-xs text-muted-foreground">Practice Mode — Round {step + 1} of 2</p>
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
                msg.sender === 'system' ? 'bg-sage-light text-foreground border border-primary/20 rounded-bl-md' :
                'bg-card text-foreground border border-border rounded-bl-md'
              }`}>
                {msg.sender === 'partner' && (
                  <span className="text-xs font-semibold block mb-1 text-secondary">💬 Partner</span>
                )}
                {msg.sender === 'system' && (
                  <span className="text-xs font-semibold block mb-1 text-primary">🧭 Coach</span>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

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
              <button onClick={() => gradeConversation(messages)} className="ml-2 underline font-medium">Retry</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Response Options */}
      {showOptions && (
        <div className="border-t border-border bg-card">
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Choose your response</p>
            {currentOptions?.map((option, i) => (
              <button
                key={i}
                onClick={() => pickOption(i)}
                className="w-full text-left px-4 py-3 rounded-xl bg-muted hover:bg-primary/10 hover:border-primary/30 border border-transparent text-sm transition-all flex items-center gap-3 group"
              >
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{option}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            {/* Custom message toggle */}
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full text-center py-2.5 text-sm text-primary font-medium hover:underline flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Or type your own response
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <input
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCustom()}
                  placeholder="Type your own response..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow"
                  autoFocus
                />
                <button onClick={sendCustom} className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow hover:opacity-90 transition-opacity">
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeChat;
