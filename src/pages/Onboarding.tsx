import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { Heart, Shield, Brain, MessageCircle, Briefcase, Users, UserX, ChevronRight, Lock } from 'lucide-react';

const goals = [
  { id: 'overthinking', label: 'Stop overthinking', icon: Brain },
  { id: 'boundaries', label: 'Better boundaries', icon: Shield },
  { id: 'conflict', label: 'Conflict skills', icon: MessageCircle },
  { id: 'secure', label: 'Feel more secure', icon: Heart },
];

const contexts = [
  { id: 'dating', label: 'Dating', icon: Heart },
  { id: 'ex', label: 'Ex / Past relationship', icon: UserX },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'work', label: 'Work / Business', icon: Briefcase },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { setProfile } = useAppState();
  const navigate = useNavigate();

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const finish = () => {
    setProfile({ goals: selectedGoals, context: selectedContext, privacyMode, onboardingComplete: true });
    navigate('/assessment');
  };

  const canNext = step === 0 ? agreed : step === 1 ? selectedGoals.length > 0 : step === 2 ? !!selectedContext : true;

  return (
    <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full gradient-hero mx-auto flex items-center justify-center shadow-glow">
                    <span className="text-2xl font-black tracking-tight text-primary-foreground" style={{ fontFamily: 'inherit' }}>JEE</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight">JEE</h1>
                  <p className="text-muted-foreground leading-relaxed">
                    Build secure communication skills through personalized coaching and guided practice.
                  </p>
                </div>
                <div className="bg-card rounded-xl p-5 shadow-soft space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Important</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This app is for <strong className="text-foreground">educational purposes only</strong>. It is not therapy, counseling, or a diagnostic tool. If you're in crisis, please contact a mental health professional.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer pt-2">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${agreed ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                      onClick={() => setAgreed(!agreed)}
                    >
                      {agreed && <ChevronRight className="w-3 h-3 text-primary-foreground rotate-[-45deg]" />}
                    </div>
                    <span className="text-sm" onClick={() => setAgreed(!agreed)}>I understand this is educational, not diagnostic</span>
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">What are your goals?</h2>
                  <p className="text-muted-foreground">Select all that apply</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map(g => {
                    const selected = selectedGoals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selected ? 'border-primary bg-sage-light shadow-glow' : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <g.icon className={`w-6 h-6 mb-2 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Your context</h2>
                  <p className="text-muted-foreground">What relationship area to focus on?</p>
                </div>
                <div className="space-y-3">
                  {contexts.map(c => {
                    const selected = selectedContext === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedContext(c.id)}
                        className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 ${
                          selected ? 'border-primary bg-sage-light shadow-glow' : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <c.icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Privacy settings</h2>
                  <p className="text-muted-foreground">Choose how your data is handled</p>
                </div>
                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={`w-full p-5 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 ${
                    privacyMode ? 'border-primary bg-sage-light shadow-glow' : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <Lock className={`w-6 h-6 ${privacyMode ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <p className="font-medium">Local-only mode</p>
                    <p className="text-sm text-muted-foreground">All data stays on your device</p>
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl border-2 border-border text-muted-foreground hover:border-primary/50 transition-colors font-medium">
              Back
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(s => s + 1) : finish()}
            disabled={!canNext}
            className="flex-1 px-6 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step < 3 ? 'Continue' : 'Start Assessment'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
