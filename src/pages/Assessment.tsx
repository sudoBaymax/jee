import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const questions = [
  { id: 1, text: "I worry that my partner will stop loving me.", dim: 'anxious' },
  { id: 2, text: "I feel comfortable depending on others.", dim: 'secure' },
  { id: 3, text: "I prefer not to show others how I feel deep down.", dim: 'avoidant' },
  { id: 4, text: "I need a lot of reassurance that I am loved.", dim: 'anxious' },
  { id: 5, text: "I find it easy to be emotionally close to others.", dim: 'secure' },
  { id: 6, text: "I get uncomfortable when someone wants to be very close.", dim: 'avoidant' },
  { id: 7, text: "When I'm upset, I reach out to my partner for comfort.", dim: 'secure' },
  { id: 8, text: "I often worry about being abandoned.", dim: 'anxious' },
  { id: 9, text: "I value my independence more than closeness.", dim: 'avoidant' },
  { id: 10, text: "I can express my needs clearly without guilt.", dim: 'secure' },
];

const likertLabels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

const triggerMap: Record<string, string[]> = {
  anxious: ['Partner being distant or vague', 'Delayed text responses', 'Perceived rejection or criticism'],
  avoidant: ['Feeling "smothered" by closeness', 'Being asked to express emotions', 'Loss of autonomy in decisions'],
  secure: ['Inconsistency in communication', 'Unresolved conflict', 'Boundary violations'],
};

const Assessment = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const { setAssessment, assessment } = useAppState();
  const navigate = useNavigate();

  const answer = (val: number) => {
    const next = { ...answers, [questions[currentQ].id]: val };
    setAnswers(next);
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 200);
    } else {
      // Score
      const dims = { secure: 0, anxious: 0, avoidant: 0 };
      questions.forEach(q => {
        const a = next[q.id] || 3;
        dims[q.dim as keyof typeof dims] += a;
      });
      const max = Math.max(dims.secure, dims.anxious, dims.avoidant);
      const total = dims.secure + dims.anxious + dims.avoidant;
      const lean = dims.secure === max ? 'Secure-leaning' : dims.anxious === max ? 'Anxious-leaning' : 'Avoidant-leaning';
      const result = {
        secure: Math.round((dims.secure / total) * 100),
        anxious: Math.round((dims.anxious / total) * 100),
        avoidant: Math.round((dims.avoidant / total) * 100),
        lean,
        triggers: triggerMap[lean.split('-')[0].toLowerCase()] || triggerMap.secure,
        completedAt: new Date().toISOString(),
      };
      setAssessment(result);
      setTimeout(() => setShowResult(true), 300);
    }
  };

  if (showResult && assessment) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
        <motion.div className="w-full max-w-lg space-y-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Your Attachment Profile</h1>
            <div className="inline-block px-4 py-1.5 rounded-full gradient-hero text-primary-foreground font-semibold text-sm">
              {assessment.lean}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
            {[
              { label: 'Secure', value: assessment.secure, color: 'bg-primary' },
              { label: 'Anxious', value: assessment.anxious, color: 'bg-secondary' },
              { label: 'Avoidant', value: assessment.avoidant, color: 'bg-accent' },
            ].map(d => (
              <div key={d.label} className="space-y-1.5">
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

          <div className="bg-card rounded-xl p-6 shadow-soft space-y-3">
            <h3 className="font-semibold">Your Top Triggers</h3>
            <ul className="space-y-2">
              {assessment.triggers.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-terracotta-light text-terracotta flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

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

        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h2 className="text-xl font-bold leading-relaxed">{questions[currentQ].text}</h2>
          <div className="space-y-2.5">
            {likertLabels.map((label, i) => {
              const val = i + 1;
              const selected = answers[questions[currentQ].id] === val;
              return (
                <button
                  key={val}
                  onClick={() => answer(val)}
                  className={`w-full p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all duration-200 ${
                    selected ? 'border-primary bg-sage-light' : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Assessment;
