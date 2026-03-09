import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EmailGate = () => {
  const [email, setEmail] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const { assessment, setAppUserId } = useAppState();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('app_users').insert({
        first_name: '',
        last_name: '',
        email: email.trim().toLowerCase(),
        attachment_lean: assessment?.lean || null,
        attachment_scores: assessment ? {
          secure: assessment.secure,
          anxious: assessment.anxious,
          avoidant: assessment.avoidant,
          fearfulAvoidant: assessment.fearfulAvoidant,
        } : null,
      });

      if (error) throw error;
      toast.success("Report unlocked! Here's your coaching plan.");
      navigate('/coach');
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen gradient-calm flex items-center justify-center px-6 py-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-full gradient-hero mx-auto flex items-center justify-center shadow-glow">
            <Mail className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Free Advice from Licensed Therapists</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We'll send you personalized tips for your{' '}
            <span className="font-semibold text-foreground">{assessment?.lean || 'attachment style'}</span>{' '}
            tendencies — just drop your email below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full pl-9 pr-3 py-3 rounded-xl border-2 border-border bg-card text-sm focus:border-primary focus:outline-none transition-colors"
                required
                maxLength={255}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground font-medium">
            100% free, no paywall. We just need your email to send you the advice.
          </p>

          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="w-full px-6 py-3.5 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <>Send Me the Tips <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default EmailGate;
