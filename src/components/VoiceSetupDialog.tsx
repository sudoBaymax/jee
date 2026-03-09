import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Volume2, X, Mic, Phone, MessageSquareText, Sparkles } from 'lucide-react';
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
  { label: '🧊 Cold boyfriend', value: 'Young man, calm but slightly cold, measured tone, American accent' },
  { label: '🔥 Angry girlfriend', value: 'Young woman, angry and impatient, slightly raised voice, snappy, American accent' },
  { label: '😢 Hurt partner (M)', value: 'Male, soft-spoken, slightly trembling, holding back emotion, British accent' },
  { label: '😤 Condescending ex (F)', value: 'Woman, confident, slightly condescending, talks down to you, American accent' },
  { label: '👩 Guilt-tripping mom', value: 'Older woman, warm motherly voice, guilt-tripping, sighs a lot, slight Southern accent' },
  { label: '🗿 Gruff dad', value: 'Older man, gruff but caring, deep voice, Midwestern American accent' },
  { label: '🇬🇧 Dismissive ex (M)', value: 'Young man, dismissive and detached, posh British accent, speaks slowly' },
  { label: '🇲🇽 Emotional partner (F)', value: 'Young woman, passionate and expressive, light Latina accent, emotional' },
  { label: '🧑‍💼 Passive-aggressive boss (M)', value: 'Middle-aged man, professional but passive-aggressive, calm surface, American accent' },
  { label: '💅 Sarcastic friend (F)', value: 'Young woman, sarcastic and witty, eye-roll energy, Valley girl accent' },
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

  const hasDescription = description.trim().length >= 5;

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

  const handlePresetClick = (presetValue: string) => {
    // Only fill if empty, otherwise append
    if (!description.trim()) {
      setDescription(presetValue);
    } else {
      setDescription(presetValue);
    }
    // Clear any previous match since description changed
    setMatchedVoice(null);
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

  const getButtonState = () => {
    if (mode === 'text') return { text: 'Start Conversation →', enabled: true, glow: true };
    if (matching) return { text: 'Creating persona...', enabled: false, glow: false };
    if (matchedVoice) return { text: 'Start with This Voice →', enabled: true, glow: true };
    if (hasDescription) return { text: 'Generate Persona', enabled: true, glow: true };
    return { text: 'Describe their tone to begin', enabled: false, glow: false };
  };

  const btnState = getButtonState();

  const handleMainButton = () => {
    if (mode === 'text') {
      handleConfirm();
    } else if (matchedVoice) {
      handleConfirm();
    } else if (hasDescription) {
      matchVoice();
    }
  };

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
              <h3 className="font-display font-semibold text-lg text-foreground">Set the Scene</h3>
              <p className="text-xs text-muted-foreground">Choose how you want to practice</p>
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
              {/* Text area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Describe their tone
                  </label>
                  <VoiceMicButton onTranscript={(text) => { setDescription(text); setMatchedVoice(null); }} />
                </div>
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); setMatchedVoice(null); }}
                  placeholder="e.g. 'Angry and impatient' or 'Calm but condescending'"
                  className="w-full bg-muted rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[70px]"
                  rows={2}
                />
              </div>

              {/* Quick presets — fade out when user has typed */}
              <AnimatePresence>
                {!hasDescription && (
                  <motion.div
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground mb-1.5">Or pick a personality:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {presets.map(p => (
                        <button
                          key={p.label}
                          onClick={() => handlePresetClick(p.value)}
                          className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-accent border border-border transition-colors text-foreground font-medium"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

          {/* Main action button — unified, state-driven */}
          <button
            onClick={handleMainButton}
            disabled={!btnState.enabled}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              btnState.glow
                ? 'gradient-hero text-primary-foreground shadow-glow hover:opacity-90'
                : 'bg-muted text-muted-foreground border border-border'
            } disabled:opacity-50`}
          >
            {matching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {btnState.text}
              </>
            ) : hasDescription && !matchedVoice && mode !== 'text' ? (
              <>
                <Sparkles className="w-4 h-4" />
                {btnState.text}
              </>
            ) : (
              btnState.text
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
