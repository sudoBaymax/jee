import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Volume2, X, Phone, MessageSquare, PhoneOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VoiceConfig {
  voiceId: string;
  voiceName: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  voiceDescription: string;
  speechQuirks: string[];
}

export type VoiceMode = 'text' | 'voice-messages' | 'voice-call';

interface VoiceSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (config: VoiceConfig) => void;
  onSkip: () => void;
  scenario: string;
  backstory: string;
  attachmentStyle: string;
}

const SPEECH_QUIRKS = [
  { id: 'stutters', label: '😤 Stutters', desc: 'Trips over words when upset' },
  { id: 'swearing', label: '🤬 Swears', desc: 'Uses profanity casually' },
  { id: 'filler-words', label: '😐 Filler words', desc: 'Says "um", "like", "you know"' },
  { id: 'sighing', label: '😮‍💨 Sighs a lot', desc: 'Audible frustration' },
  { id: 'sarcastic', label: '😏 Sarcastic tone', desc: 'Dry, biting delivery' },
  { id: 'mumbling', label: '🫢 Mumbles', desc: 'Quiet, hard to hear' },
  { id: 'fast-talker', label: '⚡ Talks fast', desc: 'Rushes through sentences' },
  { id: 'slow-deliberate', label: '🐢 Slow & deliberate', desc: 'Pauses between thoughts' },
];

const VoiceSetupDialog = ({ open, onClose, onComplete, onSkip, scenario, backstory, attachmentStyle }: VoiceSetupDialogProps) => {
  const [voiceDescription, setVoiceDescription] = useState('');
  const [selectedQuirks, setSelectedQuirks] = useState<string[]>([]);
  const [matching, setMatching] = useState(false);

  const toggleQuirk = (id: string) => {
    setSelectedQuirks(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const handleMatch = useCallback(async () => {
    if (!voiceDescription.trim() && selectedQuirks.length === 0) {
      toast.error('Describe their voice or select some speech quirks');
      return;
    }

    setMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-match', {
        body: {
          voiceDescription: voiceDescription.trim(),
          scenario,
          backstory,
          attachmentStyle,
          speechQuirks: selectedQuirks,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const config: VoiceConfig = {
        voiceId: data.voiceId,
        voiceName: data.voiceName,
        stability: data.stability ?? 0.5,
        similarityBoost: data.similarityBoost ?? 0.75,
        style: data.style ?? 0.3,
        speed: data.speed ?? 1.0,
        voiceDescription: voiceDescription.trim(),
        speechQuirks: selectedQuirks,
      };

      toast.success(`Matched voice: ${data.voiceName}`, {
        description: data.reasoning,
      });

      onComplete(config);
    } catch (e: any) {
      console.error('Voice match error:', e);
      toast.error('Failed to match voice. Try again.');
    } finally {
      setMatching(false);
    }
  }, [voiceDescription, selectedQuirks, scenario, backstory, attachmentStyle, onComplete]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border max-w-md w-full space-y-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Voice Setup</h3>
                <p className="text-xs text-muted-foreground">What does this person sound like?</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Voice description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Describe their voice
            </label>
            <textarea
              value={voiceDescription}
              onChange={e => setVoiceDescription(e.target.value)}
              placeholder="e.g. Deep male voice, kind of gruff, talks slowly when he's annoyed. Has a slight Southern accent..."
              className="w-full bg-muted rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Speech quirks */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Speech patterns
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SPEECH_QUIRKS.map(q => (
                <button
                  key={q.id}
                  onClick={() => toggleQuirk(q.id)}
                  className={`rounded-lg p-2.5 text-left transition-all border ${
                    selectedQuirks.includes(q.id)
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-muted/50 hover:border-primary/30'
                  }`}
                >
                  <p className="text-xs font-medium">{q.label}</p>
                  <p className="text-[10px] text-muted-foreground">{q.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onSkip}
              className="flex-1 py-3 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Skip (text only)
            </button>
            <button
              onClick={handleMatch}
              disabled={matching}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {matching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Find Voice
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Voice mode toggle component
export const VoiceModeToggle = ({
  mode,
  onModeChange,
  disabled,
}: {
  mode: VoiceMode;
  onModeChange: (mode: VoiceMode) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
      <button
        onClick={() => onModeChange('text')}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
          mode === 'text'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <MessageSquare className="w-3 h-3" />
        Text
      </button>
      <button
        onClick={() => onModeChange('voice-messages')}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
          mode === 'voice-messages'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Volume2 className="w-3 h-3" />
        Voice
      </button>
      <button
        onClick={() => onModeChange('voice-call')}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
          mode === 'voice-call'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Phone className="w-3 h-3" />
        Call
      </button>
    </div>
  );
};

// Audio play button for voice messages
export const VoiceMessageButton = ({
  text,
  voiceId,
  onPlay,
}: {
  text: string;
  voiceId: string;
  onPlay?: () => void;
}) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const play = async () => {
    if (playing || loading) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onplay = () => { setPlaying(true); onPlay?.(); };
      audio.onended = () => { setPlaying(false); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setPlaying(false); URL.revokeObjectURL(audioUrl); };

      await audio.play();
    } catch (e) {
      console.error('TTS playback error:', e);
      toast.error('Failed to play voice message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={play}
      disabled={loading || playing}
      className={`mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        playing
          ? 'bg-primary/20 text-primary animate-pulse'
          : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Volume2 className="w-3 h-3" />
      )}
      {loading ? 'Loading...' : playing ? 'Playing...' : '▶ Listen'}
    </button>
  );
};

export default VoiceSetupDialog;
