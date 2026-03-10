import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ChevronRight, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const EmailGate = () => {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { assessment, setAppUserId } = useAppState();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSaving(true);
    try {
      // Save user to database
      const { data, error } = await supabase.from('app_users').insert({
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
      }).select('id').single();

      if (error) throw error;

      if (data?.id) {
        setAppUserId(data.id);
      }

      // Send welcome email with tips
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: email.trim().toLowerCase(),
          lean: assessment?.lean || 'Secure',
          scores: assessment ? {
            secure: assessment.secure,
            anxious: assessment.anxious,
            avoidant: assessment.avoidant,
            fearfulAvoidant: assessment.fearfulAvoidant,
          } : null,
        },
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        // Don't block the flow if email fails
      }

      setSubmitted(true);
      toast.success("Tips sent! Check your inbox 📬");
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen gradient-calm flex items-center justify-center px-6 py-8">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <>Send Me the Tips <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            className="w-full max-w-md text-center space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Tips Sent! 📬</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Check your inbox at <span className="font-semibold text-foreground">{email}</span> for
                personalized {assessment?.lean || 'attachment style'} tips from licensed therapists.
              </p>
            </div>

            {assessment && (
              <div className="bg-card rounded-2xl p-5 border border-border space-y-3 text-left">
                <h2 className="font-semibold text-sm">Your Assessment Snapshot</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Secure', value: assessment.secure },
                    { label: 'Anxious', value: assessment.anxious },
                    { label: 'Avoidant', value: assessment.avoidant },
                    { label: 'Fearful-Avoidant', value: assessment.fearfulAvoidant },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28">{label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full gradient-hero rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{value}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Primary lean: <span className="font-semibold text-foreground">{assessment.lean}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/coach')}
              className="w-full px-6 py-3.5 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              View Your 14-Day Plan <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailGate;
