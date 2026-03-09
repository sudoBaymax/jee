import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, PenLine, Loader2,
  ImagePlus, X, Zap, Target, Users, Star, Trophy,
  Swords, Flame, Snowflake, Wind, Leaf
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceMicButton from '@/components/VoiceMicButton';

interface Scenario {
  id: string;
  label: string;
  desc: string;
  backstory: string;
  icon: any;
  attachmentStyle: string;
  opener: string;
  minRounds: number;
}

interface ScenarioMeta {
  difficulty: number; // 1-3 stars
  difficultyLabel: string;
  goal: string;
  tag?: string;
}

const scenarioMeta: Record<string, ScenarioMeta> = {
  'avoidant-ex': {
    difficulty: 3,
    difficultyLabel: 'Expert',
    goal: 'Express your needs without causing them to shut down.',
    tag: 'Most Played',
  },
  'anxious-partner': {
    difficulty: 2,
    difficultyLabel: 'Intermediate',
    goal: 'De-escalate the spiral in under 5 messages.',
    tag: 'Hardest Scenario',
  },
  'fearful-boss': {
    difficulty: 2,
    difficultyLabel: 'Intermediate',
    goal: 'Confront the betrayal without burning the bridge.',
  },
  'secure-friend': {
    difficulty: 1,
    difficultyLabel: 'Beginner',
    goal: 'Set a clear boundary while keeping the friendship.',
  },
};

const avgScores: Record<string, number> = {
  'avoidant-ex': 58,
  'anxious-partner': 64,
  'fearful-boss': 71,
  'secure-friend': 79,
};

const activeCounts: Record<string, number> = {
  'avoidant-ex': 142,
  'anxious-partner': 98,
  'fearful-boss': 67,
  'secure-friend': 43,
};

const getAttachmentIcon = (style: string) => {
  switch (style) {
    case 'dismissive-avoidant': return Snowflake;
    case 'anxious-preoccupied': return Flame;
    case 'fearful-avoidant': return Wind;
    case 'secure': return Leaf;
    default: return Zap;
  }
};

const getAttachmentColor = (style: string) => {
  switch (style) {
    case 'dismissive-avoidant': return 'text-blue-400';
    case 'anxious-preoccupied': return 'text-orange-400';
    case 'fearful-avoidant': return 'text-purple-400';
    case 'secure': return 'text-emerald-400';
    default: return 'text-primary';
  }
};

const getAttachmentBg = (style: string) => {
  switch (style) {
    case 'dismissive-avoidant': return 'bg-blue-500/10 border-blue-500/20';
    case 'anxious-preoccupied': return 'bg-orange-500/10 border-orange-500/20';
    case 'fearful-avoidant': return 'bg-purple-500/10 border-purple-500/20';
    case 'secure': return 'bg-emerald-500/10 border-emerald-500/20';
    default: return 'bg-primary/10 border-primary/20';
  }
};

interface Props {
  scenarios: Scenario[];
  onStartRandom: () => void;
  showCustomForm: boolean;
  setShowCustomForm: (v: boolean) => void;
  customPrompt: string;
  setCustomPrompt: (v: string) => void;
  customStyle: string;
  setCustomStyle: (v: string) => void;
  intensity: number;
  setIntensity: (v: number) => void;
  screenshots: string[];
  setScreenshots: (v: string[] | ((prev: string[]) => string[])) => void;
  addScreenshot: (f: File) => void;
  generatingCustom: boolean;
  onStartCustom: () => void;
  onSelectScenario: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dropZoneRef: React.RefObject<HTMLDivElement>;
  handleDrop: (e: React.DragEvent) => void;
}

const DifficultyStars = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3].map(i => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= level ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
    ))}
  </div>
);

const ScenarioSelector = ({
  scenarios, onStartRandom, showCustomForm, setShowCustomForm,
  customPrompt, setCustomPrompt, customStyle, setCustomStyle,
  intensity, setIntensity, screenshots, setScreenshots, addScreenshot,
  generatingCustom, onStartCustom, onSelectScenario,
  fileInputRef, dropZoneRef, handleDrop,
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
      <motion.div className="w-full max-w-lg space-y-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Back button */}
        <button onClick={() => navigate('/coach')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Swords className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Choose Your Battle</h1>
          <p className="text-muted-foreground text-sm">
            Pick a scenario, respond in-character, and get graded by AI based on real therapy research.
          </p>
        </div>

        <div className="space-y-3">
          {/* === ENTER THE ARENA — Surprise Me === */}
          <button
            onClick={onStartRandom}
            className="w-full rounded-xl p-5 text-left flex items-start gap-4 transition-all border-2 border-primary/40 shadow-glow hover:shadow-warm group relative overflow-hidden"
            style={{ background: 'var(--gradient-hero)' }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_60%)]" />
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 relative z-10">
              <p className="font-bold text-primary-foreground text-lg">⚡ Enter the Arena</p>
              <p className="text-primary-foreground/80 text-xs font-medium mt-0.5">Random scenario — test your instincts</p>
              <p className="text-primary-foreground/60 text-sm leading-snug mt-1">A fresh, unpredictable situation every time. No prep, just reflexes.</p>
            </div>
          </button>

          {/* === Create Your Own === */}
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="w-full bg-card rounded-xl p-5 shadow-soft text-left flex items-start gap-4 hover:shadow-glow transition-shadow border-2 border-dashed border-accent/50"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <PenLine className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">✍️ Create Your Own</p>
              <p className="text-xs text-primary/70 font-medium mt-0.5">Describe any real situation</p>
              <p className="text-sm text-muted-foreground leading-snug mt-1">Paste a real conversation, describe the person, pick their style.</p>
            </div>
          </button>

          {/* Custom form (collapsed) */}
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-foreground">Describe your scenario</label>
                      <VoiceMicButton onTranscript={(text) => setCustomPrompt(text)} />
                    </div>
                    <textarea
                      value={customPrompt}
                      onChange={e => setCustomPrompt(e.target.value)}
                      placeholder="e.g. My partner shuts down every time I bring up moving in together..."
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
                    <p className="text-xs text-muted-foreground mb-2">Upload screenshots so the AI mimics their real style</p>
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
                    onClick={onStartCustom}
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

          {/* === Scenario Cards === */}
          {scenarios.map(s => {
            const meta = scenarioMeta[s.id] || { difficulty: 2, difficultyLabel: 'Intermediate', goal: 'Navigate the conflict with empathy.' };
            const avg = avgScores[s.id] || 70;
            const active = activeCounts[s.id] || Math.floor(Math.random() * 80 + 30);
            const AttachIcon = getAttachmentIcon(s.attachmentStyle);
            const colorClass = getAttachmentColor(s.attachmentStyle);
            const bgClass = getAttachmentBg(s.attachmentStyle);

            return (
              <button
                key={s.id}
                onClick={() => onSelectScenario(s.id)}
                className={`w-full rounded-xl p-5 shadow-soft text-left flex flex-col gap-3 hover:shadow-glow transition-all border ${bgClass} relative overflow-hidden group`}
              >
                {/* Tag badge */}
                {meta.tag && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
                      {meta.tag}
                    </span>
                  </div>
                )}

                {/* Top row: icon + title + difficulty */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                    <AttachIcon className={`w-5 h-5 ${colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight">{s.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DifficultyStars level={meta.difficulty} />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{meta.difficultyLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Goal */}
                <div className="flex items-start gap-2 bg-background/50 rounded-lg px-3 py-2">
                  <Target className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground/80 leading-snug">{meta.goal}</p>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Avg score: <span className="font-bold text-foreground">{avg}/100</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {active} practicing now
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default ScenarioSelector;
