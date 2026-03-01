

# ElevenLabs Voice Integration for Practice Chat

## Overview

Add voice capabilities to the practice chat so the AI partner can "sound like" the person the user has conflict with. Two modes available: **voice messages** (tap to play TTS) and **full voice call** (real-time conversational AI via WebRTC).

## User Flow

1. User picks a scenario (or custom/surprise me)
2. **New: Voice Setup Dialog** appears before chat starts — user describes what the other person sounds like:
   - Voice characteristics (deep, high-pitched, raspy, soft)
   - Speech patterns (stutters, swearing, filler words like "um", "like")
   - Accent or dialect
   - Optional: pick from a few preset ElevenLabs voices as a base
3. User toggles between **text mode**, **voice message mode**, or **voice call mode** during the chat

## Technical Architecture

### 1. ElevenLabs API Key Setup
- Use the ElevenLabs connector to link credentials, or prompt the user for an `ELEVENLABS_API_KEY` secret
- Store as a backend secret

### 2. New Edge Function: `elevenlabs-tts`
- Accepts text + voice ID + optional voice settings
- Calls ElevenLabs TTS API, returns audio binary
- Used for "voice message" mode — each AI response gets a play button

### 3. New Edge Function: `elevenlabs-conversation-token`
- Generates a WebRTC conversation token for the ElevenLabs Conversational AI agent
- Used for "voice call" mode

### 4. Voice Setup Dialog Component
- Shown after scenario selection, before chat begins
- Fields: text description of voice, speech quirks (checkboxes: stutters, swearing, filler words, etc.), optional base voice selection from preset list
- This description gets injected into the AI system prompt AND used to select/configure the ElevenLabs voice

### 5. Practice Chat Changes
- Add a mode toggle: Text / Voice Messages / Voice Call
- **Voice Messages mode**: After each AI text response, auto-generate TTS audio and show a play button. User still types or uses speech-to-text.
- **Voice Call mode**: Use `@elevenlabs/react` `useConversation` hook for full duplex voice. The AI partner's system prompt (with attachment style, scenario, etc.) is sent to the ElevenLabs agent config.

### 6. Voice Description → System Prompt Integration
- The voice description and quirks from the setup dialog get appended to the existing practice-chat system prompt so the text responses also reflect speech patterns (e.g., including "um", writing out stutters)

## Dependencies
- `@elevenlabs/react` (new install)
- ElevenLabs API key (new secret)

## Files to Create/Modify
- **Create**: `src/components/VoiceSetupDialog.tsx` — voice description dialog
- **Create**: `supabase/functions/elevenlabs-tts/index.ts` — TTS edge function
- **Create**: `supabase/functions/elevenlabs-conversation-token/index.ts` — token edge function
- **Modify**: `src/pages/PracticeChat.tsx` — add voice setup flow, mode toggle, audio playback, voice call integration
- **Modify**: `supabase/functions/practice-chat/index.ts` — incorporate voice description into system prompt

## Implementation Order
1. Set up ElevenLabs API key as secret
2. Create TTS edge function
3. Create conversation token edge function
4. Build VoiceSetupDialog component
5. Integrate voice message playback into PracticeChat
6. Integrate voice call mode using `useConversation`
7. Wire voice description into system prompts

