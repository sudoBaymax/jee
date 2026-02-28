import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Session {
  id: string;
  person1_name: string;
  person1_attachment: string;
  person2_name: string | null;
  person2_attachment: string | null;
  situation: string | null;
}

interface Message {
  sender: string;
  sender_name: string;
  content: string;
}

const CouplesReport = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const generateReport = async () => {
      // Load session
      const { data: session } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('session_code', code)
        .maybeSingle();

      if (!session) { setError('Session not found'); setLoading(false); return; }

      // Load messages
      const { data: messages } = await supabase
        .from('couples_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) {
        setError('No messages found in this session');
        setLoading(false);
        return;
      }

      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/couples-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: messages.map((m: Message) => ({
              sender: m.sender,
              sender_name: m.sender_name,
              content: m.content,
            })),
            person1_name: session.person1_name,
            person1_attachment: session.person1_attachment,
            person2_name: session.person2_name || 'Person 2',
            person2_attachment: session.person2_attachment || 'unknown',
            situation: session.situation,
          }),
        });

        const data = await resp.json();
        if (data.error) { setError(data.error); }
        else { setReport(data.report); }
      } catch (e) {
        setError('Failed to generate report');
      }
      setLoading(false);
    };

    generateReport();
  }, [code]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/couples')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm flex-1">Session Report</h2>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 space-y-4"
          >
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Generating your session report...</p>
            <p className="text-muted-foreground text-xs">This may take a moment</p>
          </motion.div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
            <button onClick={() => navigate('/couples')} className="mt-4 text-sm text-primary hover:underline">
              Back to Couples Setup
            </button>
          </div>
        )}

        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm dark:prose-invert max-w-none bg-card rounded-xl p-6 border border-border shadow-soft"
          >
            <ReactMarkdown>{report}</ReactMarkdown>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CouplesReport;
