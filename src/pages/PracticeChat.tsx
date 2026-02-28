import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Award, ChevronRight, MessageCircle, UserX, Heart, Briefcase } from 'lucide-react';
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

interface Round {
  options: string[];
  replies: Record<number, string>;
}

interface Scenario {
  id: string;
  label: string;
  desc: string;
  backstory: string;
  icon: typeof UserX;
  opener: string;
  rounds: Round[];
}

const scenarios: Scenario[] = [
  {
    id: 'avoidant-ex',
    label: 'Your Ex Wants to "Talk"',
    desc: 'After 3 months of no contact, your avoidant ex texted you at 11pm saying they miss you',
    backstory: 'You dated for 2 years. They broke up with you because they "needed space." You\'ve been healing, but seeing their name on your phone brought everything back. You agreed to meet for coffee the next day. You\'re sitting across from them now.',
    icon: UserX,
    opener: "So… thanks for coming. I know this is weird. I just… I've been thinking about us. I miss what we had. But I'm not sure I'm ready for anything serious again. I just wanted to see you.",
    rounds: [
      {
        options: [
          "I appreciate you being honest. I miss parts of what we had too. But I need to understand — what exactly are you looking for here?",
          "You miss me? After you left me with no real explanation? That's rich.",
          "I miss you too! We should try again, I know it'll be different this time.",
          "I feel conflicted hearing this. Part of me wants to reconnect, and part of me remembers how hurt I was. I need to be honest about that before we go further.",
        ],
        replies: {
          0: "I don't really know, honestly. I just… felt like I needed to see you. I know that's not a great answer.",
          1: "I knew you'd bring that up. This is why I hesitated to reach out. Can we not do the blame thing?",
          2: "Whoa, slow down. I said I miss you, not that I want to jump back in. I don't even know what I want yet.",
          3: "That's fair. I know I hurt you when I left. I wasn't in a good place. I'm not sure I'm in a great place now either, honestly.",
        },
      },
      {
        options: [
          "I hear that you're uncertain, and I need to protect my own healing. I can't be in a 'maybe' situation. What would you need to figure out before you'd know?",
          "So you just wanted to see me to feel better about yourself? That's kind of selfish.",
          "It's okay, we can just take it slow and see what happens. No pressure.",
          "I feel sad hearing you say you're still not in a great place. I care about you AND I have a boundary — I can't be your comfort blanket while you figure things out.",
        ],
        replies: {
          0: "I… probably need therapy, honestly. I know I have a pattern of running. I don't want to do that to you again. But I can't promise I won't.",
          1: "Maybe it is selfish. I don't know. I just know I felt something was missing and it was you. But if this is just going to be a fight, I should go.",
          2: "Yeah… that sounds nice. But I feel like last time we 'took it slow' and then I panicked and ghosted you. I don't want to repeat that.",
          3: "Comfort blanket… that stings. But you're not wrong. I think I did come here partly because I'm lonely. That's not fair to you.",
        },
      },
      {
        options: [
          "I appreciate that honesty more than you know. Here's what I need: if we're going to have any kind of relationship — even a friendship — I need consistent communication. Not a text at 11pm and then silence for weeks. Can you commit to that?",
          "You know what, let's just forget it. This was a mistake.",
          "I'll wait for you. However long it takes.",
          "I feel tender toward you right now. I want to be compassionate AND truthful: I need you to get help before I can let you back into my life. That's not an ultimatum — it's me valuing both of us.",
        ],
        replies: {
          0: "Consistent communication is… hard for me. You know that. But I hear you. Maybe I could try — like a weekly check-in? Something structured might actually help me not disappear.",
          1: "…okay. I'm sorry I wasted your time. I just… I don't know how to do this right.",
          2: "Please don't wait for me. That's too much pressure and I'll just feel guilty and pull away even more. That's not healthy for either of us.",
          3: "You're right. I know I need help. I actually looked up a therapist last week but didn't call. Maybe this conversation is the push I needed. I don't want to lose you permanently.",
        },
      },
      {
        options: [
          "A weekly check-in could work. But I want to be clear — this isn't us getting back together. This is two people who care about each other figuring out if a healthy connection is even possible. Are you okay with that frame?",
          "I think we should just go no-contact again. This is too confusing.",
          "Yeah let's do the check-in thing! And maybe dinner this weekend?",
          "I feel hopeful hearing you say that, and I also feel cautious. My boundary is: we do the weekly check-ins for a month. If you disappear even once without explanation, I'm done. Not as punishment — but because I deserve reliability. Does that feel fair?",
        ],
        replies: {
          0: "That's… actually really mature. Yeah. I can work with that. No expectations, just seeing if we can actually communicate like adults. I want to try.",
          1: "I understand. I probably deserve that. Take care of yourself, okay?",
          2: "I — dinner feels like a lot right now. Can we stick to the check-ins first? I don't want to rush and then bail again.",
          3: "A month of check-ins with that boundary… that's firm but fair. I respect that. And honestly, it makes me feel safer too because it's clear. Okay. Let's try.",
        },
      },
    ],
  },
  {
    id: 'anxious-partner',
    label: 'Partner After a Night Out',
    desc: 'Your partner of 8 months is upset because you went out with friends and didn\'t text back',
    backstory: 'You went to a friend\'s birthday party last night. Your phone died around 10pm and you got home at 1am. Your partner called 6 times and sent 14 texts, escalating from "having fun?" to "I can\'t believe you\'re doing this to me." It\'s the next morning and you\'re having coffee together.',
    icon: Heart,
    opener: "I didn't sleep at all last night. I was up until 1am panicking. I called you six times. You couldn't even send one text? Do you even care about me? Because right now it doesn't feel like it.",
    rounds: [
      {
        options: [
          "My phone died, and I'm sorry you were worried. I do care about you — can I explain what happened before we go further?",
          "I feel overwhelmed right now. You sent 14 texts and called 6 times. That's a lot. I need us to talk about this calmly.",
          "Oh my god, it's not that serious. I was at a party. People go to parties.",
          "I understand you were scared, and I'm sorry. At the same time, I feel pressured by how many times you called. Can we talk about both things?",
        ],
        replies: {
          0: "Your phone died? Okay… but you could have used someone else's phone. You didn't even think about me? I was imagining the worst.",
          1: "Overwhelmed? I was the one alone in bed imagining you were hurt or with someone else! And you're making ME the problem?",
          2: "Not that serious?! I thought something happened to you! I almost drove to the hospital! But sure, I'm just overreacting, right?",
          3: "I WAS scared! I thought you were dead or… I don't know, with someone else. I know the calling was a lot but I couldn't help it. I was spiraling.",
        },
      },
      {
        options: [
          "I hear that you spiraled, and that sounds really painful. I want to address that. AND I also need to share that when I saw 14 texts, I felt suffocated. Both things can be true.",
          "You thought I was with someone else? That really hurts. I've never given you a reason to think that. Where is this coming from?",
          "You need to get that under control. I can't live like this.",
          "I feel sad that your mind went to those places. I want to find a solution together. What if we created a plan for nights when my phone might die — like a backup way to reach me?",
        ],
        replies: {
          0: "Suffocated? I — okay. I hear that. I don't WANT to be that person. It's just… when I can't reach you, my brain goes to this dark place and I can't stop it.",
          1: "I know you haven't. Logically I know that. But in the moment, alone at midnight, logic doesn't work. My anxiety just takes over.",
          2: "Get it under control? You think I WANT to feel like this? You think I enjoy panicking for three hours? If you cared, you'd help me feel safe instead of criticizing me.",
          3: "A backup plan? Like what? I mean… that's actually not a bad idea. I just don't want to feel like I'm being managed like a problem.",
        },
      },
      {
        options: [
          "You're not a problem — you're my partner and I love you. The plan isn't about managing you, it's about both of us feeling secure. What if I text your best friend if my phone dies, so you get a message through them?",
          "I feel compassionate toward your anxiety AND I need to be honest: I can't be responsible for regulating your emotions when I'm out living my life. I need you to have tools for when I'm not reachable.",
          "Maybe you should talk to someone about this. Like, professionally.",
          "I care about you deeply. I feel worried that this pattern — me going out, you panicking — will wear us both down. Can we commit to working on this together, maybe with a couples counselor?",
        ],
        replies: {
          0: "Texting my friend is actually really sweet. That way I'd know you're okay without feeling like I'm being clingy to YOU. I like that.",
          1: "That's hard to hear but… you're right. I can't expect you to be my only source of calm. I used to have coping strategies before we dated. I kind of stopped using them.",
          2: "Professionally? Are you saying I'm crazy?",
          3: "A couples counselor? I — I'd actually be open to that. I don't want to be the person who sends 14 texts. That's not who I want to be either.",
        },
      },
      {
        options: [
          "I'm glad you're open to that. I want to be clear about what I need going forward: when I go out, I'll give you an estimated time I'll be home. If plans change, I'll find a way to let you know. In return, I need you to try — even if it's hard — to wait before assuming the worst. Can we try that?",
          "I love that you're open to growing. My boundary for tonight is: I need you to trust that when I say I care, I mean it — even when I'm not right next to you. I need that trust to feel safe too.",
          "Good, because this can't keep happening. I need you to fix this before it destroys us.",
          "I feel really connected to you right now. This is the kind of hard conversation that actually brings us closer. I appreciate you being vulnerable with me.",
        ],
        replies: {
          0: "That's really specific and clear. I can try that. And honestly, having a plan makes me feel calmer already. I'm sorry about last night. I'll work on my side.",
          1: "You need to feel safe too? I never thought about it that way — that my anxiety makes YOU feel unsafe in the relationship. I'm sorry. I trust you. I'll keep working on showing that.",
          2: "Fix this? Like I'm broken? I thought we were having a real conversation but now you're just giving me ultimatums.",
          3: "I feel connected too. And I'm sorry for last night. I want to be better. Can we… can we hug? I think I need that right now.",
        },
      },
    ],
  },
  {
    id: 'work-conflict',
    label: 'Boss Took Credit for Your Work',
    desc: 'Your manager presented your project idea as their own in a leadership meeting',
    backstory: 'You spent 3 weeks developing a proposal for a new client strategy. You shared it with your manager for feedback. Yesterday, a colleague told you your manager presented it word-for-word to the VP as their own idea. You\'ve asked your manager for a private meeting. You\'re in their office now.',
    icon: Briefcase,
    opener: "Hey, you wanted to chat? I've got about 15 minutes before my next call. What's up?",
    rounds: [
      {
        options: [
          "Thanks for making time. I'll be direct: I heard my client strategy proposal was presented to the VP yesterday. I want to understand what happened, because that was my work.",
          "I feel frustrated and I need to talk about it. My proposal was presented to leadership without my name on it. That feels like my contribution was erased.",
          "Did you seriously present my proposal as your own? What the hell?",
          "So, I heard about the VP meeting yesterday. I just want to make sure we're aligned on how my work gets credited going forward.",
        ],
        replies: {
          0: "Oh — the client strategy? Yeah, I brought it up in the leadership sync. I meant to mention you put the initial draft together. It moved fast and I should have looped you in.",
          1: "Erased? That's a strong word. I presented a team initiative. Your research informed it, sure, but I added my own thinking too.",
          2: "Whoa, let's take the temperature down. I presented a team strategy that your work contributed to. That's how it works — I represent the team's work to leadership.",
          3: "Sure, I'm happy to discuss credit. What specifically are you concerned about?",
        },
      },
      {
        options: [
          "I appreciate you acknowledging that. 'Should have looped me in' is exactly right. Going forward, I need to be in the room — or at minimum credited by name — when my work is presented. Can we agree on that?",
          "I hear you saying it was a team initiative, and I respect that framing. But the structure, the research, and the recommendations were mine. I feel dismissed when that's described as 'informing' your work. I need my contributions acknowledged specifically.",
          "That's not how it works. That's how people get their work stolen. I want credit for what I created.",
          "I feel tense bringing this up because I value our working relationship. AND I need to advocate for myself. Can we find a way to handle attribution that works for both of us?",
        ],
        replies: {
          0: "That's fair. I'll make sure you're credited. Honestly, the VP was impressed — this could be good visibility for you. Let me set up a follow-up where you present the details directly.",
          1: "Okay, I hear you. You're right that the core of it was your work. I should have been clearer about that. What do you want me to do about it now?",
          2: "Stolen? I think you're being dramatic. I represent this team's output. That's literally my job. But fine — I'll CC you next time.",
          3: "I appreciate you being professional about this. You're right that we should have a system. What would you suggest?",
        },
      },
      {
        options: [
          "I'd love that meeting with the VP. And I want to propose something: for any project where I'm the primary author, I draft the exec summary and present it myself, with you there for support. Does that work?",
          "I feel grateful that you're willing to make it right. What I need specifically is: a follow-up email to the VP clarifying my role, and a process change so this doesn't happen again. Can we do both?",
          "Just don't do it again.",
          "I appreciate you hearing me. I feel more confident about our working relationship when credit is clear. My suggestion: I create a shared doc for every project that lists contributors and roles. Transparent from day one.",
        ],
        replies: {
          0: "You presenting directly to the VP? That's a big step. I'm not opposed to it, but let me think about how to position it. I don't want it to seem like I'm being bypassed in the chain.",
          1: "A follow-up email I can do — I'll send it today. A process change… what are you thinking? I'm open to ideas but I need it to be realistic.",
          2: "Sure. Noted.",
          3: "A shared contributor doc? That's actually smart. It protects everyone — including me. Let's pilot it on the next project and see how it goes.",
        },
      },
      {
        options: [
          "I understand the concern about positioning. I feel confident we can frame it as you developing your team — which reflects well on you as a leader. The VP seeing me present your team's talent is a win for both of us. Can we pitch it that way?",
          "I'll draft the process doc this week. I feel good about where this conversation landed. One more thing — I need to hear you say that my work matters here. Not as flattery, but because consistent recognition is what keeps me motivated and loyal to this team.",
          "Whatever. As long as it doesn't happen again.",
          "I feel respected that you're engaging with this. My boundary is clear: I need credit for my intellectual work. Within that boundary, I'm flexible on how we structure it. Let's figure out the details over email so we both have it documented.",
        ],
        replies: {
          0: "Developing my team… that's actually a good angle. Okay, let me talk to the VP's assistant and get you on the calendar. Bring your A-game — this is your shot.",
          1: "Your work matters here. I mean that. You're one of the strongest contributors on this team and I should say that more often. I'll send the email today and let's get that process doc going.",
          2: "Got it.",
          3: "Fair. Let's move to email for the specifics. And for what it's worth — I respect that you came to me directly instead of going around me. That says a lot about your professionalism.",
        },
      },
    ],
  },
];

const PracticeChat = () => {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scenario = scenarios.find(s => s.id === scenarioId);
  const totalRounds = scenario?.rounds.length ?? 0;

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
      { id: '0', sender: 'system', text: s.backstory },
      { id: '1', sender: 'partner', text: s.opener },
    ]);
  };

  const advanceStep = (newMsgs: Message[]) => {
    setMessages(newMsgs);
    setShowCustom(false);
    setCustomInput('');

    if (step + 1 >= totalRounds) {
      setStep(totalRounds);
      gradeConversation(newMsgs);
    } else {
      setStep(step + 1);
    }
  };

  const pickOption = (index: number) => {
    if (!scenario) return;
    const round = scenario.rounds[step];
    const userText = round.options[index];
    const partnerText = round.replies[index];

    advanceStep([
      ...messages,
      { id: Date.now().toString(), sender: 'user', text: userText },
      { id: (Date.now() + 1).toString(), sender: 'partner', text: partnerText },
    ]);
  };

  const sendCustom = () => {
    if (!customInput.trim() || !scenario) return;
    const round = scenario.rounds[step];
    const lower = customInput.toLowerCase();
    let replyIndex = 0;
    if (lower.includes('feel') && lower.includes('need')) replyIndex = 3;
    else if (lower.includes('boundary') || lower.includes('limit')) replyIndex = 2;
    else if (lower.includes('feel') || lower.includes('care') || lower.includes('appreciate')) replyIndex = 0;
    else replyIndex = 1;

    const partnerText = round.replies[replyIndex] || round.replies[0];

    advanceStep([
      ...messages,
      { id: Date.now().toString(), sender: 'user', text: customInput },
      { id: (Date.now() + 1).toString(), sender: 'partner', text: partnerText },
    ]);
  };

  const gradeConversation = async (allMessages: Message[]) => {
    setGrading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('grade-conversation', {
        body: {
          scenario: `${scenario?.label}: ${scenario?.desc}. Backstory: ${scenario?.backstory}`,
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
            <p className="text-muted-foreground text-sm">Choose a real-life scenario to practice</p>
          </div>
          <div className="space-y-3">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => startScenario(s.id)}
                className="w-full bg-card rounded-xl p-5 shadow-soft text-left flex items-start gap-4 hover:shadow-glow transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const currentRound = step < totalRounds ? scenario?.rounds[step] : null;
  const showOptions = step < totalRounds && !grading;

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
      <div className="p-4 border-b border-border bg-card flex items-center gap-3">
        <button onClick={() => { setScenarioId(null); setMessages([]); setStep(0); }} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-sm">{scenario?.label}</p>
          <p className="text-xs text-muted-foreground">Round {Math.min(step + 1, totalRounds)} of {totalRounds}</p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < step ? 'bg-primary' : i === step ? 'bg-primary/50' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

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

      {showOptions && currentRound && (
        <div className="border-t border-border bg-card">
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How do you respond?</p>
            {currentRound.options.map((option, i) => (
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
