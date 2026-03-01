import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Award, MessageCircle, UserX, Heart, Briefcase, Shield, AlertTriangle, PenLine, Undo2, Mic, MicOff, Gauge, ImagePlus, X, Phone, PhoneOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppState } from '@/context/AppContext';
import VoiceSetupDialog, { VoiceConfig, VoiceMode, VoiceModeToggle, VoiceMessageButton } from '@/components/VoiceSetupDialog';
import { useConversation } from '@elevenlabs/react';

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

const randomScenarios = [
  {
    label: 'Your Roommate Won\'t Clean Up',
    desc: 'You\'ve asked 5 times. The dishes are piling up. You need to set a firm boundary without blowing up.',
    backstory: 'You\'ve lived together for a year. They\'re fun, but domestically hopeless. Last week you found moldy pasta in a pot they left for 4 days. You\'ve tried hints, you\'ve tried asking nicely, you\'ve tried doing it yourself. Nothing sticks. You just got home to a sink full of dishes again. They\'re on the couch watching TV.',
    attachmentStyle: 'passive-aggressive',
    opener: "Oh hey! How was your day? I was gonna do those dishes, I just got caught up in this show. You know how it is. Want to watch with me?",
  },
  {
    label: 'Your Parent Is Guilt-Tripping You',
    desc: 'Your mom is upset you\'re not coming home for the holidays and is laying it on thick.',
    backstory: 'You decided to spend the holidays with your partner\'s family this year. You told your mom two weeks ago. She said "fine" but has been sending passive-aggressive texts since. Today she called, and you can tell she\'s been crying. She keeps saying "I just want to see my baby" and "I guess I\'ll just be alone." Your partner is in the other room.',
    attachmentStyle: 'anxious-preoccupied',
    opener: "I just don\'t understand why you can\'t come for even one day. I\'ve been cooking your favorite meals all week. Your room is all ready. I even got that blanket you like. But I guess that doesn\'t matter anymore now that you have your new family.",
  },
  {
    label: 'Your Partner Forgot Your Anniversary',
    desc: 'It\'s your 2-year anniversary. They completely forgot and made plans with friends instead.',
    backstory: 'You\'ve been looking forward to this for weeks. You bought a gift, made a reservation. This morning you said "happy anniversary" and they looked at you blankly, then said "oh… right." They already told their friends they\'d go to a game tonight. They\'re acting like it\'s not a big deal.',
    attachmentStyle: 'dismissive-avoidant',
    opener: "Look, I\'m sorry I forgot, okay? It\'s just a date. We can do something this weekend. I already told the guys I\'d go tonight and I don\'t want to bail on them. You\'re not seriously upset about this, are you?",
  },
  {
    label: 'A Friend Shared Your Secret',
    desc: 'You told one friend something private. Now the whole group knows.',
    backstory: 'Two weeks ago you confided in your closest friend that you\'re seeing a therapist for anxiety. Yesterday at a group dinner, someone casually asked "so how\'s therapy going?" You were mortified. Your friend who leaked it is now texting you saying "it just slipped out, it\'s not a big deal, everyone goes to therapy."',
    attachmentStyle: 'dismissive-avoidant',
    opener: "Okay I know you\'re mad but honestly I don\'t see why it\'s such a big deal. Everyone goes to therapy now, it\'s nothing to be ashamed of. I was literally just talking about mental health in general and it came up naturally. You\'re making this way bigger than it needs to be.",
  },
  {
    label: 'Your Coworker Takes Credit for Your Work',
    desc: 'In a team meeting, your coworker presented your idea as theirs. Your boss loved it.',
    backstory: 'You shared a detailed proposal with your coworker last week for feedback. In today\'s all-hands meeting, they presented the exact same idea — your words, your slides — as their own. The boss praised them. Nobody knows it was yours. You\'re in the break room now and they just walked in.',
    attachmentStyle: 'fearful-avoidant',
    opener: "Great meeting, right? I think the boss is really on board. Hey, we should grab lunch — I want to brainstorm some next steps on the project. You always have good ideas.",
  },
  {
    label: 'Your Sibling Keeps Borrowing Money',
    desc: 'Your sibling is asking for money again. This is the fourth time this year and they never pay you back.',
    backstory: 'Your younger sibling has borrowed $200, $150, and $300 from you this year with promises to pay back "next month." None of it has been returned. Now they\'re calling asking for $500 for "an emergency." Last time the "emergency" was concert tickets. You love them but you\'re being taken advantage of.',
    attachmentStyle: 'anxious-preoccupied',
    opener: "Hey, so I know this is awkward but I\'m in a really tight spot. I wouldn\'t ask if it wasn\'t serious. I just need $500 to cover something and I\'ll pay you back everything next month, I promise. You know I\'m good for it. You\'re the only person I can ask.",
  },
];

const getRandomScenario = (): Scenario => {
  const pick = randomScenarios[Math.floor(Math.random() * randomScenarios.length)];
  return {
    id: 'custom-random',
    label: pick.label,
    desc: pick.desc,
    backstory: pick.backstory,
    icon: AlertTriangle,
    attachmentStyle: pick.attachmentStyle,
    opener: pick.opener,
    minRounds: 6,
  };
};

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

const getQuickReplies = (scenario: Scenario, round: number): string[] => {
  if (round === 0) {
    // First response options
    if (scenario.attachmentStyle === 'dismissive-avoidant') {
      return [
        "I'm glad you reached out, but I need to understand what changed.",
        "Honestly, I'm not sure why I agreed to this.",
        "You said you missed me. What does that actually mean?",
      ];
    }
    if (scenario.attachmentStyle === 'anxious-preoccupied') {
      return [
        "I understand you were worried, and I'm sorry my phone died.",
        "I hear you're upset, but I need you to hear my side too.",
        "That sounds really scary for you. Can we talk about it calmly?",
      ];
    }
    if (scenario.attachmentStyle === 'fearful-avoidant') {
      return [
        "Actually, I wanted to talk about the meeting on Wednesday.",
        "I appreciate that, but I need to bring something up.",
        "Thanks — but I don't think we're on the same page about something.",
      ];
    }
    return [
      "I appreciate you checking in. I do want to talk about something specific.",
      "Thanks — yeah, there's something that's been on my mind.",
      "I'm okay, but I need to be honest with you about something.",
    ];
  }
  // Mid-conversation options
  if (scenario.attachmentStyle === 'dismissive-avoidant') {
    return [
      "I hear you, but that doesn't really answer my question.",
      "I need more than that. Can you be specific?",
      "That's not what I'm asking. What do you actually want?",
    ];
  }
  if (scenario.attachmentStyle === 'anxious-preoccupied') {
    return [
      "I understand your feelings are valid, and so are mine.",
      "I need you to trust me. Can we talk about what would help?",
      "I'm not going to apologize for having a life outside of us.",
    ];
  }
  if (scenario.attachmentStyle === 'fearful-avoidant') {
    return [
      "I want to be direct — what happened in that meeting wasn't okay.",
      "I need to know I can trust you to have my back.",
      "Can we agree on how to handle this going forward?",
    ];
  }
  return [
    "I need you to respect that boundary.",
    "I love you, but this pattern needs to change.",
    "What I need from you going forward is…",
  ];
};

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { setChatActive } = useAppState();

  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customStyle, setCustomStyle] = useState('dismissive-avoidant');
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [revertToId, setRevertToId] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(7);
  const [isListening, setIsListening] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('text');
  const [showVoiceSetup, setShowVoiceSetup] = useState(false);
  const [pendingScenarioStart, setPendingScenarioStart] = useState<{ id: string; override?: Scenario } | null>(null);
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const activeScenario = customScenario || scenarios.find(s => s.id === scenarioId) || null;

  const addScreenshot = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only images are supported'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    if (screenshots.length >= 5) { toast.error('Max 5 screenshots'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshots(prev => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  }, [screenshots.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(addScreenshot);
  }, [addScreenshot]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!showCustomForm) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) addScreenshot(file);
      }
    }
  }, [showCustomForm, addScreenshot]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') toast.error('Microphone access denied.');
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (scenarioId && !loading && !grading) {
      inputRef.current?.focus();
    }
  }, [scenarioId, loading, grading, messages]);

  const startScenario = (id: string, override?: Scenario) => {
    const s = override || scenarios.find(s => s.id === id)!;
    setScenarioId(id);
    if (override) setCustomScenario(override);
    else setCustomScenario(null);
    setScenarioId(id);
    setChatActive(true);
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

  const exitChat = () => {
    setScenarioId(null);
    setMessages([]);
    setRoundCount(0);
    setGrade(null);
    setChatActive(false);
    setShowCustomForm(false);
    setCustomPrompt('');
    setRevertToId(null);
  };

  const confirmRevert = () => {
    if (!revertToId) return;
    const idx = messages.findIndex(m => m.id === revertToId);
    if (idx === -1) { setRevertToId(null); return; }
    // Keep messages up to (but not including) the selected user message
    const kept = messages.slice(0, idx);
    setMessages(kept);
    // Recalculate round count (number of user messages remaining)
    const userMsgsLeft = kept.filter(m => m.sender === 'user').length;
    setRoundCount(userMsgsLeft);
    setShowEndOption(userMsgsLeft >= (activeScenario?.minRounds || 6));
    setRevertToId(null);
    setError(null);
    toast.success('Conversation reverted');
  };

  const startCustomScenario = async () => {
    if (!customPrompt.trim()) return;
    setGeneratingCustom(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('practice-chat', {
        body: {
          scenario: customPrompt.trim(),
          attachmentStyle: customStyle,
          backstory: `The user described this situation: "${customPrompt.trim()}". Create a realistic opening line as the other person in this scenario.`,
          messages: [],
          intensity,
          screenshots: screenshots.length > 0 ? screenshots : undefined,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const custom: Scenario = {
        id: 'user-custom',
        label: customPrompt.trim(),
        desc: customPrompt.trim(),
        backstory: customPrompt.trim() + (screenshots.length > 0 ? ' [User provided screenshot references of how this person communicates]' : ''),
        icon: PenLine,
        attachmentStyle: customStyle,
        opener: data.reply,
        minRounds: 6,
      };
      startScenario(custom.id, custom);
      setShowCustomForm(false);
      setCustomPrompt('');
      setScreenshots([]);
    } catch (e: any) {
      console.error('Custom scenario error:', e);
      toast.error('Failed to generate scenario. Try again.');
    } finally {
      setGeneratingCustom(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeScenario || loading) return;

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
          scenario: activeScenario.desc || activeScenario.label,
          attachmentStyle: activeScenario.attachmentStyle,
          backstory: activeScenario.backstory,
          messages: chatHistory,
          intensity,
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

      if (newRound >= activeScenario.minRounds) {
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
          scenario: `${activeScenario?.label}: ${activeScenario?.desc}. Backstory: ${activeScenario?.backstory}. The partner's attachment style is: ${activeScenario?.attachmentStyle}`,
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
            {/* Random scenario button */}
            <button
              onClick={() => {
                const random = getRandomScenario();
                startScenario(random.id, random);
              }}
              className="w-full bg-card rounded-xl p-5 shadow-soft text-left flex items-start gap-4 hover:shadow-glow transition-shadow border-2 border-dashed border-primary/30"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">🎲 Surprise Me</p>
                <p className="text-xs text-primary/70 font-medium mt-0.5">Random scenario each time</p>
                <p className="text-sm text-muted-foreground leading-snug mt-1">Get a fresh, realistic situation to practice your communication skills.</p>
              </div>
            </button>

            {/* Create Your Own */}
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="w-full bg-card rounded-xl p-5 shadow-soft text-left flex items-start gap-4 hover:shadow-glow transition-shadow border-2 border-dashed border-accent/50"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <PenLine className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">✍️ Create Your Own</p>
                <p className="text-xs text-primary/70 font-medium mt-0.5">Describe any situation</p>
                <p className="text-sm text-muted-foreground leading-snug mt-1">Type your own scenario and pick the attachment style of the person you're talking to.</p>
              </div>
            </button>

            <AnimatePresence>
              {showCustomForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card rounded-xl p-5 shadow-soft space-y-4 border border-border">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Describe your scenario</label>
                      <textarea
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="e.g. My partner shuts down every time I bring up moving in together. I want to have the conversation tonight..."
                        className="w-full bg-muted rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Their attachment style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'dismissive-avoidant', label: '🧊 Avoidant', desc: 'Pulls away, shuts down' },
                          { value: 'anxious-preoccupied', label: '🔥 Anxious', desc: 'Clingy, needs reassurance' },
                          { value: 'fearful-avoidant', label: '🌪️ Fearful-Avoidant', desc: 'Hot & cold, unpredictable' },
                          { value: 'secure', label: '🌿 Secure', desc: 'Calm but still human' },
                        ].map(style => (
                          <button
                            key={style.value}
                            onClick={() => setCustomStyle(style.value)}
                            className={`rounded-lg p-3 text-left transition-all border ${
                              customStyle === style.value
                                ? 'border-primary bg-primary/10 shadow-sm'
                                : 'border-border bg-muted/50 hover:border-primary/30'
                            }`}
                          >
                            <p className="text-sm font-medium">{style.label}</p>
                            <p className="text-xs text-muted-foreground">{style.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Screenshot upload */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Screenshots of their texts <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <p className="text-xs text-muted-foreground mb-2">Upload screenshots of real conversations so the AI mimics their style</p>
                      <div
                        ref={dropZoneRef}
                        onDrop={handleDrop}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <ImagePlus className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Drag & drop, paste, or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{screenshots.length}/5 screenshots</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(addScreenshot);
                          e.target.value = '';
                        }}
                      />
                      {screenshots.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                          {screenshots.map((src, i) => (
                            <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border">
                              <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setScreenshots(prev => prev.filter((_, j) => j !== i)); }}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Intensity: {intensity}/10
                        <span className="text-xs text-muted-foreground ml-2">
                          {intensity <= 3 ? '😌 Mild' : intensity <= 5 ? '😐 Moderate' : intensity <= 7 ? '😤 Challenging' : '🔥 Intense'}
                        </span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={intensity}
                        onChange={e => setIntensity(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Easy-going</span>
                        <span>Very difficult</span>
                      </div>
                    </div>
                    <button
                      onClick={startCustomScenario}
                      disabled={!customPrompt.trim() || generatingCustom}
                      className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generatingCustom ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Setting the scene...
                        </>
                      ) : (
                        'Start Conversation'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
              onClick={() => startScenario(scenarioId!, activeScenario || undefined)}
              className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={exitChat}
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
      <div className="border-b border-border bg-card">
        <div className="p-4 flex items-center gap-3">
          <button onClick={exitChat} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="font-semibold text-sm">{activeScenario?.label}</p>
            <p className="text-xs text-muted-foreground">
              {activeScenario?.attachmentStyle.replace('-', ' ')} • {roundCount} exchange{roundCount !== 1 ? 's' : ''}
            </p>
          </div>
          {!grading && roundCount >= 1 && (
            <button
              onClick={endAndGrade}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              End & Grade
            </button>
          )}
        </div>
        <div className="px-4 pb-3 flex items-center gap-3">
          <Gauge className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="flex-1 accent-primary h-1.5"
          />
          <span className="text-xs text-muted-foreground w-20 text-right flex-shrink-0">
            {intensity <= 3 ? '😌 Mild' : intensity <= 5 ? '😐 Moderate' : intensity <= 7 ? '😤 Hard' : '🔥 Intense'}
          </span>
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
              <div className="relative group max-w-[85%]">
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
                {msg.sender === 'user' && !grading && !grade && (
                  <button
                    onClick={() => setRevertToId(msg.id)}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-muted hover:bg-accent border border-border"
                    title="Revert to before this message"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
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
        <div className="border-t border-border bg-card p-3 space-y-2">
          {showEndOption && (
            <p className="text-xs text-center text-muted-foreground">
              You can keep chatting or tap "End & Grade" to get feedback
            </p>
          )}
          {/* Quick reply suggestions */}
          {!loading && activeScenario && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {getQuickReplies(activeScenario, roundCount).map((reply, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(reply); inputRef.current?.focus(); }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-foreground hover:bg-accent transition-colors border border-border"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isListening ? "Listening…" : "Type or tap 🎙 to speak…"}
              disabled={loading}
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow disabled:opacity-50 resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-muted hover:bg-accent text-foreground border border-border'
              }`}
              title={isListening ? 'Stop recording' : 'Speak your response'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { if (isListening) stopListening(); sendMessage(); }}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Revert confirmation overlay */}
      <AnimatePresence>
        {revertToId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setRevertToId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 shadow-lg border border-border max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Undo2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Revert conversation?</h3>
                  <p className="text-xs text-muted-foreground">Everything after this point will be deleted</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRevertToId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRevert}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                >
                  Revert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PracticeChat;
