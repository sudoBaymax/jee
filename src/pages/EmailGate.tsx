import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EmailGate = () => {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { assessment } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Save assessment data if available
        if (assessment?.lean) {
          const email = session.user.email || '';
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          const [firstName, ...lastParts] = name.split(' ');
          await supabase.from('app_users').insert({
            first_name: firstName || 'User',
            last_name: lastParts.join(' ') || '',
            email,
            attachment_lean: assessment.lean || null,
            attachment_scores: {
              secure: assessment.secure,
              anxious: assessment.anxious,
              avoidant: assessment.avoidant,
              fearfulAvoidant: assessment.fearfulAvoidant,
            },
          });
        }
        navigate('/coach');
      }
      setCheckingAuth(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/coach');
      } else {
        setCheckingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, assessment]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error('Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <LogIn className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Before we start...</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sign in with Google to unlock your personalized coaching plan and access couples counseling.
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full px-6 py-3.5 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          We only use your Google account for authentication. Your conversations are never saved.
        </p>
      </motion.div>
    </div>
  );
};

export default EmailGate;
