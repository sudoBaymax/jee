import { Mic, MicOff } from 'lucide-react';
import { useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceMicButton({ onTranscript, className = '' }: VoiceMicButtonProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`p-2 rounded-lg transition-all ${
        isListening
          ? 'bg-destructive/20 text-destructive animate-pulse'
          : 'bg-muted hover:bg-accent text-muted-foreground'
      } ${className}`}
      title={isListening ? 'Stop recording' : 'Voice input'}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
