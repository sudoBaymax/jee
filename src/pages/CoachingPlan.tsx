import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { CheckCircle2, Circle, ChevronRight, MessageCircle, Flame, Sparkles, Shield } from 'lucide-react';

const phases = [
  { name: 'Awareness', days: [1, 2, 3], icon: Sparkles, desc: 'Trigger → body signal → impulse' },
  { name: 'Regulation', days: [4, 5, 6, 7], icon: Flame, desc: 'Pause rule, breathing, clarity questions' },
  { name: 'Secure Messaging', days: [8, 9, 10, 11], icon: MessageCircle, desc: 'Feeling + need + request + boundary' },
  { name: 'Relationship Choices', days: [12, 13, 14], icon: Shield, desc: 'Non-negotiables + closing loops' },
];

const secureScripts = [
  { title: 'Setting a Boundary', text: '"I care about this relationship, and I need [specific boundary]. This isn\'t about punishing you — it\'s about protecting what we have."' },
  { title: 'Repair After Conflict', text: '"I want to own my part. I reacted from [fear/frustration], and what I actually needed was [need]. Can we talk about how to handle this differently?"' },
  { title: 'Asking for a Pause', text: '"I\'m feeling activated right now, and I don\'t want to say something I\'ll regret. Can we take 20 minutes and come back to this?"' },
  { title: 'Expressing a Need', text: '"When [situation happens], I feel [emotion]. What I need is [specific request]. Would you be open to that?"' },
];

const CoachingPlan = () => {
  const { currentDay, setCurrentDay, progress, setProgress } = useAppState();
  const [showScripts, setShowScripts] = useState(false);
  const [selectedScript, setSelectedScript] = useState<number | null>(null);
  const navigate = useNavigate();

  const completeDay = (day: number) => {
    const exists = progress.find(p => p.day === day);
    if (!exists) {
      setProgress([...progress, { day, completed: true }]);
    }
    if (day >= currentDay) setCurrentDay(day + 1);
  };

  const isDayComplete = (day: number) => progress.some(p => p.day === day && p.completed);

  return (
    <div className="min-h-screen gradient-calm pb-24">
      <div className="max-w-lg mx-auto p-4 pt-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <h1 className="text-2xl font-bold">14-Day Coaching Plan</h1>
          <p className="text-muted-foreground text-sm">Day {Math.min(currentDay, 14)} of 14</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
            <motion.div className="h-full gradient-hero rounded-full" animate={{ width: `${(Math.min(currentDay - 1, 14) / 14) * 100}%` }} />
          </div>
        </motion.div>

        {/* Phases */}
        <div className="space-y-4">
          {phases.map((phase, pi) => (
            <motion.div
              key={phase.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.1 }}
              className="bg-card rounded-xl p-4 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentDay > phase.days[phase.days.length - 1] ? 'bg-primary text-primary-foreground' : 'bg-sage-light text-primary'}`}>
                  <phase.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{phase.name}</h3>
                  <p className="text-xs text-muted-foreground">{phase.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {phase.days.map(day => {
                  const done = isDayComplete(day);
                  const current = day === currentDay;
                  return (
                    <button
                      key={day}
                      onClick={() => day <= currentDay && completeDay(day)}
                      disabled={day > currentDay}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        done ? 'bg-primary text-primary-foreground' :
                        current ? 'bg-sage-light text-primary border-2 border-primary' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 mx-auto" /> : `Day ${day}`}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scripts */}
        <div className="space-y-3">
          <button
            onClick={() => setShowScripts(!showScripts)}
            className="w-full flex items-center justify-between bg-card rounded-xl p-4 shadow-soft"
          >
            <span className="font-semibold">Secure Scripts Library</span>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showScripts ? 'rotate-90' : ''}`} />
          </button>
          {showScripts && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              {secureScripts.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedScript(selectedScript === i ? null : i)}
                  className="w-full bg-card rounded-xl p-4 shadow-soft text-left space-y-2"
                >
                  <span className="font-medium text-sm">{s.title}</span>
                  {selectedScript === i && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground italic leading-relaxed">
                      {s.text}
                    </motion.p>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <button
          onClick={() => navigate('/practice')}
          className="w-full px-6 py-3.5 rounded-xl gradient-warm text-primary-foreground font-semibold shadow-warm hover:opacity-90 transition-opacity"
        >
          Practice Chat <MessageCircle className="inline w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default CoachingPlan;
