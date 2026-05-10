import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders } from '../_shared/cors.ts';
import { Errors } from '../_shared/errors.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const RequestSchema = z.object({
  query: z.string().min(1).max(100),
  page: z.number().int().min(1).max(50).optional().default(1),
});

const UNSPLASH_BASE = 'https://api.unsplash.com';

const CATEGORIES = [
  'modern house floor plan',
  'house blueprint design',
  'apartment floor plan',
  'luxury home plan',
  'minimalist house plan',
  'two story house plans',
  'victorian house floor plan',
  'contemporary home design',
  'architectural floor plan',
  'single family house plan',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getAuthUser(req);
    const allowed = await checkRateLimit(`unsplash:${user.id}`, 30, 3600);
    if (!allowed) return Errors.rateLimited('Unsplash search rate limit exceeded');
  } catch {
    // Allow unauthenticated access but rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const allowed = await checkRateLimit(`unsplash-ip:${ip}`, 10, 3600);
    if (!allowed) return Errors.rateLimited('Unsplash search rate limit exceeded');
  }

  const apiKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
  if (!apiKey) {
    return Errors.upstream('Unsplash API key not configured');
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Errors.validation('Invalid request body');
  }

  const { query, page } = parsed.data;

  try {
    const url = `${UNSPLASH_BASE}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=12&orientation=landscape`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Unsplash API error:', res.status, errText);
      return Errors.upstream(`Unsplash API error: ${res.status}`);
    }

    const data = await res.json() as {
      total: number;
      total_pages: number;
      results: Array<{
        id: string;
        description: string | null;
        urls: { thumb: string; small: string; regular: string };
        user: { name: string; username: string };
        links: { html: string };
      }>;
    };

    const results = data.results.map((photo) => ({
      id: photo.id,
      description: photo.description ?? '',
      thumb: photo.urls.thumb,
      small: photo.urls.small,
      regular: photo.urls.regular,
      photographer: photo.user.name,
      photographerUsername: photo.user.username,
      link: photo.links.html,
    }));

    return new Response(
      JSON.stringify({
        results,
        total: data.total,
        totalPages: data.total_pages,
        query,
        page,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Unsplash search error:', err);
    return Errors.internal('Failed to search Unsplash');
  }
});