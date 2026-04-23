import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
import { logAudit, extractRequestMeta } from '../_shared/audit.ts';
import { checkQuota } from '../_shared/quota.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const user = await getAuthUser(req);

    const rateLimitOk = await checkRateLimit(`transcribe:${user.id}`, 30, 3600);
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB — Whisper API limit
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return new Response(JSON.stringify({ error: 'Audio file exceeds 25 MB limit' }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!audioFile.type.startsWith('audio/')) {
      return new Response(JSON.stringify({ error: 'File must be an audio type' }), {
        status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.warn('[transcribe] OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({
        error: 'AI not configured',
        code: 'UPSTREAM_ERROR',
        message: 'The AI service is not yet configured on this server. Please contact support.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'audio.m4a');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'en');

    const quotaOk = await checkQuota(user.id, 'ai_generation');
    if (!quotaOk) {
      return new Response(JSON.stringify({ error: 'AI quota exceeded' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50_000);

    let whisperResponse: Response;
    try {
      whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: whisperForm,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      console.error('[transcribe]', isTimeout ? 'Request timed out after 50s' : fetchErr);
      // Return empty transcript rather than failing hard — the user can type manually
      return new Response(JSON.stringify({ transcript: '', error: 'TRANSCRIPTION_TIMEOUT' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    clearTimeout(timeoutId);

    if (!whisperResponse.ok) {
      throw new Error(`Whisper API error: ${whisperResponse.status}`);
    }

    const result = await whisperResponse.json() as { text: string };

    const { ip, userAgent } = extractRequestMeta(req);
    await logAudit({
      user_id: user.id,
      action: 'audio_transcribed',
      resource_type: 'transcription',
      metadata: { fileSizeBytes: audioFile.size },
      ip_address: ip ?? undefined,
      user_agent: userAgent ?? undefined,
    });

    return new Response(JSON.stringify({ transcript: result.text }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcribe error:', error);
    return new Response(JSON.stringify({ error: 'Transcription failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
