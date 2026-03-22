import { requireAuth } from '../_shared/auth.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    await requireAuth(req);

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      // Graceful fallback: tell client to use device speech recognition
      return new Response(
        JSON.stringify({ fallback: 'device_speech' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio');
    if (!audioFile || typeof audioFile === 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing audio file' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'audio.m4a');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'en');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error('[transcribe] Whisper API error:', errText);
      return new Response(
        JSON.stringify({ error: 'TRANSCRIPTION_FAILED' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const result = await whisperResponse.json();
    return new Response(
      JSON.stringify({ transcript: result.text ?? '' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[transcribe] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
