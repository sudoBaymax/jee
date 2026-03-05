import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Copy, Check, ArrowRight, History, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface SavedSession {
  code: string;
  role: string;
  name: string;
  partnerName?: string;
  date: string;
}

const getSavedSessions = (): SavedSession[] => {
  try {
    return JSON.parse(localStorage.getItem('couples_history') || '[]');
  } catch { return []; }
};

const saveSession = (session: SavedSession) => {
  const history = getSavedSessions().filter(s => s.code !== session.code);
  history.unshift(session);
  localStorage.setItem('couples_history', JSON.stringify(history.slice(0, 20)));
};

const attachmentStyles = [
  { id: 'secure', label: 'Secure' },
  { id: 'anxious-preoccupied', label: 'Anxious' },
  { id: 'dismissive-avoidant', label: 'Avoidant' },
  { id: 'fearful-avoidant', label: 'Fearful-Avoidant' },
  { id: 'unknown', label: "I don't know" },
];

const CouplesSetup = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [attachment, setAttachment] = useState('unknown');
  const [situation, setSituation] = useState('');
  const [aiMode, setAiMode] = useState<'on_request' | 'after_both'>('after_both');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const createSession = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    setLoading(true);
    const code = generateCode();
    const { error } = await supabase.from('couples_sessions').insert({
      session_code: code,
      person1_name: name.trim(),
      person1_attachment: attachment,
      situation: situation.trim() || null,
      ai_mode: aiMode,
    });
    setLoading(false);
    if (error) { toast.error('Failed to create session'); console.error(error); return; }
    setCreatedCode(code);
    localStorage.setItem('couples_role', 'person1');
    localStorage.setItem('couples_name', name.trim());
    saveSession({ code, role: 'person1', name: name.trim(), date: new Date().toISOString() });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const joinSession = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!joinCode.trim()) { toast.error('Please enter the session code'); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('couples_sessions')
      .select('*')
      .eq('session_code', joinCode.trim().toUpperCase())
      .maybeSingle();
    if (error || !data) {
      toast.error('Session not found — check the code');
      setLoading(false);
      return;
    }
    if (data.person2_name) {
      toast.error('Session is already full');
      setLoading(false);
      return;
    }
    await supabase
      .from('couples_sessions')
      .update({ person2_name: name.trim(), person2_attachment: attachment })
      .eq('id', data.id);
    localStorage.setItem('couples_role', 'person2');
    localStorage.setItem('couples_name', name.trim());
    saveSession({ code: data.session_code, role: 'person2', name: name.trim(), partnerName: data.person1_name, date: new Date().toISOString() });
    setLoading(false);
    navigate(`/couples/chat/${data.session_code}`);
  };

  const goToChat = () => navigate(`/couples/chat/${createdCode}`);

  const pastSessions = getSavedSessions();

  const openPastSession = (session: SavedSession) => {
    localStorage.setItem('couples_role', session.role);
    localStorage.setItem('couples_name', session.name);
    navigate(`/couples/chat/${session.code}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-8">
      <motion.div
        className="w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Couples Counseling</h1>
          <p className="text-muted-foreground mt-2">AI-guided therapy for two — real-time, together</p>
        </div>

        {mode === 'choose' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all text-left"
            >
              <p className="font-semibold text-lg">Start a Session</p>
              <p className="text-sm text-muted-foreground">Create a room and invite your partner</p>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all text-left"
            >
              <p className="font-semibold text-lg">Join a Session</p>
              <p className="text-sm text-muted-foreground">Enter a code from your partner</p>
            </button>

            {pastSessions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Past Sessions</p>
                </div>
                <div className="space-y-2">
                  {pastSessions.map(s => (
                    <button
                      key={s.code}
                      onClick={() => openPastSession(s)}
                      className="w-full p-4 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-all text-left flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.name} {s.partnerName ? `& ${s.partnerName}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.code} · {new Date(s.date).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'create' && !createdCode && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Your Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 rounded-xl border-2 border-border bg-card text-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Your Attachment Style</label>
              <div className="flex flex-wrap gap-2">
                {attachmentStyles.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setAttachment(s.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      attachment === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Situation / Topic</label>
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss..."
                rows={3}
                className="w-full p-3 rounded-xl border-2 border-border bg-card text-foreground focus:border-primary outline-none transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">AI Therapist Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAiMode('after_both')}
                  className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${
                    aiMode === 'after_both' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <p className="font-medium">After Both Speak</p>
                  <p className="text-xs text-muted-foreground">AI waits for both</p>
                </button>
                <button
                  onClick={() => setAiMode('on_request')}
                  className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${
                    aiMode === 'on_request' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <p className="font-medium">On Request</p>
                  <p className="text-xs text-muted-foreground">Ask for input manually</p>
                </button>
              </div>
            </div>
            <button
              onClick={createSession}
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
            <button onClick={() => setMode('choose')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          </div>
        )}

        {mode === 'create' && createdCode && (
          <div className="space-y-6 text-center">
            <div className="bg-card rounded-xl p-6 shadow-soft">
              <p className="text-sm text-muted-foreground mb-2">Share this code with your partner</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black tracking-widest text-primary font-display">{createdCode}</span>
                <button onClick={copyCode} className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Waiting for your partner to join...</p>
            <button
              onClick={goToChat}
              className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Enter Session <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Your Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 rounded-xl border-2 border-border bg-card text-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Your Attachment Style</label>
              <div className="flex flex-wrap gap-2">
                {attachmentStyles.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setAttachment(s.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      attachment === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Session Code</label>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-letter code"
                maxLength={6}
                className="w-full p-3 rounded-xl border-2 border-border bg-card text-foreground focus:border-primary outline-none transition-colors text-center text-2xl font-black tracking-widest"
              />
            </div>
            <button
              onClick={joinSession}
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Joining...' : 'Join Session'}
            </button>
            <button onClick={() => setMode('choose')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CouplesSetup;
