import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Volume2, X, Mic, Phone, MessageSquareText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VoiceMicButton from '@/components/VoiceMicButton';

export type VoiceMode = 'text' | 'voice-messages' | 'voice-call';

export interface VoiceConfig {
  mode: VoiceMode;
  voiceId: string | null;
  voiceName: string | null;
  voiceDescription: string;
}

interface VoiceSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: VoiceConfig) => void;
  scenario: string;
  attachmentStyle: string;
  backstory: string;
}

const voiceModes = [
  {
    id: 'text' as VoiceMode,
    label: 'Text Only',
    desc: 'Classic chat — no voice',
    icon: MessageSquareText,
  },
  {
    id: 'voice-messages' as VoiceMode,
    label: 'Voice Messages',
    desc: 'AI replies as voice notes',
    icon: Volume2,
  },
  {
    id: 'voice-call' as VoiceMode,
    label: 'Voice Call',
    desc: 'Live real-time voice conversation',
    icon: Phone,
    comingSoon: true,
  },
];

const presets = [
  'Deep male voice, calm and measured',
  'Young woman, expressive and emotional',
  'Older man, gruff but caring',
  'Soft-spoken, gentle, slightly nervous',
  'Confident, slightly condescending tone',
  'Warm motherly voice, guilt-tripping',
];

export default function VoiceSetupDialog({
  open,
  onClose,
  onConfirm,
  scenario,
  attachmentStyle,
  backstory,
}: VoiceSetupDialogProps) {
  const [mode, setMode] = useState<VoiceMode>('voice-messages');
  const [description, setDescription] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchedVoice, setMatchedVoice] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const matchVoice = async () => {
    setMatching(true);
    setMatchedVoice(null);
    try {
      const { data, error } = await supabase.functions.invoke('voice-match', {
        body: {
          voiceDescription: description.trim(),
          scenario,
          attachmentStyle,
          backstory,
        },
      });
      if (error) throw error;
      setMatchedVoice({ id: data.voiceId, name: data.voiceName, reason: data.reason });
    } catch (e) {
      console.error('Voice match error:', e);
      toast.error('Could not match voice. Using default.');
      setMatchedVoice({ id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', reason: 'Default fallback' });
    } finally {
      setMatching(false);
    }
  };

  const previewVoice = async () => {
    if (!matchedVoice) return;
    setPreviewing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: "Look, I don't really want to talk about this right now. Can we just... not?",
            voiceId: matchedVoice.id,
          }),
        }
      );
      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (e) {
      console.error('Preview error:', e);
      toast.error('Could not preview voice.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      mode,
      voiceId: mode === 'text' ? null : matchedVoice?.id || null,
      voiceName: mode === 'text' ? null : matchedVoice?.name || null,
      voiceDescription: description,
    });
  };

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
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Voice Setup</h3>
              <p className="text-xs text-muted-foreground">How should they sound?</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Mode selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Chat mode</label>
            <div className="grid grid-cols-3 gap-2">
              {voiceModes.map(m => (
                <button
                  key={m.id}
                  onClick={() => !m.comingSoon && setMode(m.id)}
                  disabled={m.comingSoon}
                  className={`relative rounded-xl p-3 text-center transition-all border ${
                    mode === m.id
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : m.comingSoon
                      ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                      : 'border-border bg-muted/50 hover:border-primary/30'
                  }`}
                >
                  <m.icon className="w-5 h-5 mx-auto mb-1 text-foreground" />
                  <p className="text-xs font-medium">{m.label}</p>
                  {m.comingSoon && (
                    <span className="absolute -top-1.5 -right-1.5 bg-secondary text-secondary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Voice description — only show for voice modes */}
          {mode !== 'text' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Describe their voice
                  </label>
                  <VoiceMicButton onTranscript={(text) => setDescription(text)} />
                </div>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. A 30-year-old guy with a calm but slightly cold voice, American accent, speaks slowly..."
                  className="w-full bg-muted rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  rows={3}
                />
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5">
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => setDescription(p)}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent border border-border transition-colors text-muted-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Match button */}
              <button
                onClick={matchVoice}
                disabled={matching || !description.trim()}
                className="w-full py-2.5 rounded-xl bg-muted hover:bg-accent border border-border text-sm font-medium text-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {matching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finding the perfect voice...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Match Voice
                  </>
                )}
              </button>

              {/* Matched result */}
              {matchedVoice && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        🎙 {matchedVoice.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{matchedVoice.reason}</p>
                    </div>
                    <button
                      onClick={previewVoice}
                      disabled={previewing}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {previewing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                      Preview
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={mode !== 'text' && !matchedVoice && !matching}
            className="w-full py-3 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {mode === 'text' ? 'Start Chat' : matchedVoice ? 'Start with This Voice' : 'Match a Voice First'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
