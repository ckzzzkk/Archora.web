# /voice-prompt

Record a voice prompt and transcribe it for AI generation (Creator/Architect tier).

## Usage
```
/voice-prompt
```

## What this does
1. Checks `audioInput` tier gate
2. Records audio using `expo-av`
3. Sends audio to `transcribe` Edge Function (OpenAI Whisper)
4. Transcript is populated in the PromptInput component
5. User can review and trigger generation

## Tier gate
- Requires `audioInput = true` (Creator or Architect)

## Key files
- `supabase/functions/transcribe/index.ts` — Whisper transcription
- `src/services/aiService.ts` — `transcribeAudio()`
- `src/components/blueprint/PromptInput.tsx` — voice button
