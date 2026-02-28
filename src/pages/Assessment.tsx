import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { ChevronRight, ArrowLeft, Loader2, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ECR-R inspired items — 10 Anxiety, 10 Avoidance
// Items marked reverse:true are reverse-coded (7 becomes 1, etc.)
const questions = [
  // Anxiety subscale (1–10)
  { id: 1, text: "I worry about being abandoned by people close to me.", subscale: 'anxiety', reverse: false },
  { id: 2, text: "I feel confident that my partner really loves me.", subscale: 'anxiety', reverse: true },
  { id: 3, text: "I need a lot of reassurance that I am loved.", subscale: 'anxiety', reverse: false },
  { id: 4, text: "I often worry that my partner doesn't really care about me.", subscale: 'anxiety', reverse: false },
  { id: 5, text: "I rarely worry about being left behind.", subscale: 'anxiety', reverse: true },
  { id: 6, text: "When I can't reach my partner, I imagine the worst.", subscale: 'anxiety', reverse: false },
  { id: 7, text: "I get upset when my partner doesn't respond quickly.", subscale: 'anxiety', reverse: false },
  { id: 8, text: "I feel secure in my close relationships.", subscale: 'anxiety', reverse: true },
  { id: 9, text: "I'm afraid that once someone gets to know me, they won't like me.", subscale: 'anxiety', reverse: false },
  { id: 10, text: "My desire to be very close sometimes scares people away.", subscale: 'anxiety', reverse: false },

  // Avoidance subscale (11–20)
  { id: 11, text: "I prefer not to show others how I feel deep down.", subscale: 'avoidance', reverse: false },
  { id: 12, text: "I find it easy to depend on close others.", subscale: 'avoidance', reverse: true },
  { id: 13, text: "I get uncomfortable when someone wants to be very close.", subscale: 'avoidance', reverse: false },
  { id: 14, text: "I am comfortable sharing my private thoughts and feelings.", subscale: 'avoidance', reverse: true },
  { id: 15, text: "I find it difficult to allow myself to depend on others.", subscale: 'avoidance', reverse: false },
  { id: 16, text: "I value my independence more than my relationships.", subscale: 'avoidance', reverse: false },
  { id: 17, text: "I turn to my partner for comfort when I'm upset.", subscale: 'avoidance', reverse: true },
  { id: 18, text: "I don't feel comfortable opening up to others.", subscale: 'avoidance', reverse: false },
  { id: 19, text: "I feel comfortable being emotionally close to others.", subscale: 'avoidance', reverse: true },
  { id: 20, text: "I try to avoid getting too close to my partner.", subscale: 'avoidance', reverse: false },
];

const likertLabels = [
  'Strongly Disagree',
  'Disagree',
  'Somewhat Disagree',
  'Neutral',
  'Somewhat Agree',
  'Agree',
  'Strongly Agree',
];

const fallbackTriggers: Record<string, string[]> = {
  'Anxious-Preoccupied': ['Partner being distant or vague', 'Delayed text responses', 'Perceived rejection or criticism'],
  'Dismissive-Avoidant': ['Feeling "smothered" by closeness', 'Being asked to express emotions', 'Loss of autonomy in decisions'],
  'Fearful-Avoidant': ['Intimacy feeling unsafe yet loneliness painful', 'Unpredictable partner behavior', 'Being vulnerable and then hurt'],
  'Secure': ['Inconsistency in communication', 'Unresolved conflict', 'Boundary violations'],
};

const fallbackPatterns: Record<string, string[]> = {
  'Anxious-Preoccupied': ['Seeking excessive reassurance', 'Hypervigilance to partner mood shifts', 'Difficulty self-soothing'],
  'Dismissive-Avoidant': ['Emotional withdrawal under stress', 'Valuing self-reliance over connection', 'Minimizing emotional needs'],
  'Fearful-Avoidant': ['Push-pull dynamics in relationships', 'Wanting closeness but fearing it', 'Difficulty trusting consistently'],
  'Secure': ['Comfortable with interdependence', 'Effective conflict resolution', 'Clear emotional communication'],
};

function scoreAnswers(answers: Record<number, number>) {
  let anxiety = 0;
  let avoidance = 0;

  questions.forEach(q => {
    const raw = answers[q.id] || 4; // default to neutral
    const scored = q.reverse ? (8 - raw) : raw;
    if (q.subscale === 'anxiety') anxiety += scored;
    else avoidance += scored;
  });

  return { anxiety, avoidance };
}

function classify(anxiety: number, avoidance: number) {
  // Median on a 1-7 scale across 10 items = 40
  const anxHigh = anxiety > 40;
  const avoHigh = avoidance > 40;

  if (!anxHigh && !avoHigh) return 'Secure';
  if (anxHigh && !avoHigh) return 'Anxious-Preoccupied';
  if (!anxHigh && avoHigh) return 'Dismissive-Avoidant';
  return 'Fearful-Avoidant';
}

const Assessment = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setAssessment, assessment } = useAppState();
  const navigate = useNavigate();

  const answer = async (val: number) => {
    const next = { ...answers, [questions[currentQ].id]: val };
    setAnswers(next);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 200);
      return;
    }

    // All questions answered — score
    const scores = scoreAnswers(next);
    const lean = classify(scores.anxiety, scores.avoidance);
    const total = scores.anxiety + scores.avoidance;
    const anxPct = Math.round((scores.anxiety / 70) * 100);
    const avoPct = Math.round((scores.avoidance / 70) * 100);
    const securePct = Math.max(0, 100 - Math.round(((scores.anxiety + scores.avoidance) / 140) * 100));
    const fearfulPct = lean === 'Fearful-Avoidant' ? Math.round(((scores.anxiety + scores.avoidance) / 140) * 100) : 0;

    const baseResult = {
      secure: securePct,
      anxious: anxPct,
      avoidant: avoPct,
      fearfulAvoidant: fearfulPct,
      lean,
      triggers: fallbackTriggers[lean] || fallbackTriggers.Secure,
      patterns: fallbackPatterns[lean] || fallbackPatterns.Secure,
      completedAt: new Date().toISOString(),
    };

    setAssessment(baseResult);
    setShowResult(true);
    setIsAnalyzing(true);

    // Call AI for deeper analysis
    try {
      const { data, error } = await supabase.functions.invoke('assess', {
        body: { answers: next, scores, lean },
      });

      if (error) throw error;
      if (data && !data.error) {
        setAssessment({
          ...baseResult,
          aiInsight: data.narrative,
          triggers: data.triggers || baseResult.triggers,
          patterns: data.patterns || baseResult.patterns,
          growthAreas: data.growthAreas,
        });
      }
    } catch (err) {
      console.error('AI analysis failed, using rule-based fallback:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (showResult && assessment) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
        <motion.div className="w-full max-w-lg space-y-5 pb-8" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Your Attachment Profile</h1>
            <div className="inline-block px-4 py-1.5 rounded-full gradient-hero text-primary-foreground font-semibold text-sm">
              {assessment.lean}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-card rounded-xl p-5 shadow-soft space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">AI-Powered Insight</h3>
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {isAnalyzing ? (
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-full" />
                <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/5" />
              </div>
            ) : assessment.aiInsight ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{assessment.aiInsight}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Analysis based on standard ECR-R scoring.</p>
            )}
          </div>

          {/* Score Bars */}
          <div className="bg-card rounded-xl p-5 shadow-soft space-y-3">
            {[
              { label: 'Secure', value: assessment.secure, color: 'bg-primary' },
              { label: 'Anxious', value: assessment.anxious, color: 'bg-secondary' },
              { label: 'Avoidant', value: assessment.avoidant, color: 'bg-accent' },
              ...(assessment.fearfulAvoidant > 0
                ? [{ label: 'Fearful-Avoidant', value: assessment.fearfulAvoidant, color: 'bg-destructive' }]
                : []),
            ].map(d => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{d.label}</span>
                  <span className="text-muted-foreground">{d.value}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${d.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${d.value}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Triggers */}
          <div className="bg-card rounded-xl p-5 shadow-soft space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="font-semibold text-sm">Your Top Triggers</h3>
            </div>
            <ul className="space-y-2">
              {assessment.triggers.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Patterns */}
          {assessment.patterns && assessment.patterns.length > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Relationship Patterns</h3>
              </div>
              <ul className="space-y-2">
                {assessment.patterns.map((p, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Growth Areas */}
          {assessment.growthAreas && assessment.growthAreas.length > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <h3 className="font-semibold text-sm">Growth Areas</h3>
              </div>
              <ul className="space-y-2">
                {assessment.growthAreas.map((g, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-secondary mt-1">✦</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => navigate('/coach')}
            className="w-full px-6 py-3.5 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity"
          >
            Start Your Coaching Plan <ChevronRight className="inline w-4 h-4 ml-1" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
      <motion.div className="w-full max-w-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => currentQ > 0 ? setCurrentQ(c => c - 1) : navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-sm text-muted-foreground font-medium">{currentQ + 1}/{questions.length}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                {questions[currentQ].subscale === 'anxiety' ? 'Anxiety Subscale' : 'Avoidance Subscale'}
              </p>
              <h2 className="text-xl font-bold leading-relaxed">{questions[currentQ].text}</h2>
            </div>
            <div className="space-y-2">
              {likertLabels.map((label, i) => {
                const val = i + 1;
                const selected = answers[questions[currentQ].id] === val;
                return (
                  <button
                    key={val}
                    onClick={() => answer(val)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all duration-200 ${
                      selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Assessment;
