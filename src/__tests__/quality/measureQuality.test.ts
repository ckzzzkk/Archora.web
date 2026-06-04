/**
 * measureQuality.test.ts — architectural quality MEASUREMENT HARNESS.
 *
 * Runs a spread of representative briefs through the generation pipeline, scores
 * each result with the deterministic architectural validator (+ geometry validator),
 * and prints a report: per-brief category scores and aggregate pass rates. This is
 * how we KNOW where generations stand — by measuring, not hoping.
 *
 * ── Procedural baseline (default — free, offline, deterministic) ──
 *   npx vitest run src/__tests__/quality/measureQuality.test.ts
 *
 * ── Live AI measurement (real ai-generate-optimal output — costs credits) ──
 *   RUN_AI_QUALITY=1 \
 *   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co \
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
 *   QUALITY_AI_TOKEN=<a valid user access token (JWT)> \
 *   npx vitest run src/__tests__/quality/measureQuality.test.ts
 *
 *   Each brief = one real generation against the user's quota. The harness applies
 *   the same deterministic auto-repair the production path uses (so tracing works)
 *   but does NOT fall back to procedural — we want to score the AI's actual design.
 *   The GeoCrit column shows how often the AI produced critically-broken geometry.
 */
import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { generateFloorPlan } from '../../utils/layoutEngine';
import { autoRepairBlueprint } from '../../utils/geometry/autoRepair';
import { assessArchitecturalQuality } from '../../utils/geometry/architecturalQuality';
import { validateBlueprint, violationSummary } from '../../utils/geometry/blueprintValidator';
import type { GenerationPayload } from '../../types/generation';
import type { BlueprintData } from '../../types/blueprint';

const USE_AI = !!process.env.RUN_AI_QUALITY;

function brief(over: Partial<GenerationPayload> & { buildingType: GenerationPayload['buildingType'] }): GenerationPayload {
  return {
    buildingType: over.buildingType,
    plotSize: 175, plotUnit: 'm2', bedrooms: 3, bathrooms: 2, livingAreas: 1,
    hasGarage: false, hasGarden: true, hasPool: false, hasHomeOffice: false, hasUtilityRoom: false,
    style: 'modern', additionalNotes: '', ...over,
  };
}

const BRIEFS: Array<{ label: string; payload: GenerationPayload }> = [
  { label: 'Studio',                 payload: brief({ buildingType: 'studio', bedrooms: 0, bathrooms: 1, livingAreas: 1, plotSize: 45 }) },
  { label: '1-bed apartment',        payload: brief({ buildingType: 'apartment', bedrooms: 1, bathrooms: 1, plotSize: 60 }) },
  { label: '2-bed apartment',        payload: brief({ buildingType: 'apartment', bedrooms: 2, bathrooms: 1, plotSize: 85 }) },
  { label: '3-bed house',            payload: brief({ buildingType: 'house', bedrooms: 3, bathrooms: 2, plotSize: 150 }) },
  { label: '3-bed house + garage',   payload: brief({ buildingType: 'house', bedrooms: 3, bathrooms: 2, hasGarage: true, hasUtilityRoom: true, plotSize: 180 }) },
  { label: '4-bed house + office',   payload: brief({ buildingType: 'house', bedrooms: 4, bathrooms: 3, hasHomeOffice: true, hasGarage: true, plotSize: 220 }) },
  { label: '4-bed villa + pool',     payload: brief({ buildingType: 'villa', bedrooms: 4, bathrooms: 3, hasPool: true, hasGarage: true, plotSize: 300 }) },
  { label: '2-storey 4-bed house',   payload: brief({ buildingType: 'house', bedrooms: 4, bathrooms: 3, floors: 2, hasGarage: true, plotSize: 200 }) },
];

/** Live AI generation via the deployed ai-generate-optimal edge function. */
async function generateViaAI(payload: GenerationPayload): Promise<BlueprintData> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const token = process.env.QUALITY_AI_TOKEN;
  if (!url || !token) {
    throw new Error('Live AI mode needs EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY and QUALITY_AI_TOKEN');
  }
  // A random sessionId is fine — the edge function's progress updates no-op if the row is absent.
  const sessionId = (globalThis.crypto?.randomUUID?.() ?? `sess-${Date.now()}`);
  const res = await fetch(`${url}/functions/v1/ai-generate-optimal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...payload, sessionId }),
  });
  if (!res.ok) throw new Error(`ai-generate-optimal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const raw = await res.json() as unknown;
  return (raw && typeof raw === 'object' && 'blueprint' in raw)
    ? (raw as { blueprint: BlueprintData }).blueprint
    : (raw as BlueprintData);
}

async function produce(payload: GenerationPayload): Promise<BlueprintData> {
  const bp = USE_AI ? await generateViaAI(payload) : generateFloorPlan(payload);
  // Same deterministic repair the production path runs, so geometry traces cleanly.
  // We do NOT fall back to procedural here — the point is to score the AI's own design.
  return autoRepairBlueprint(bp).repaired;
}

describe('architectural quality measurement harness', () => {
  it('reports quality scores across representative briefs', async () => {
    const PASS = 80;

    const rows: Array<{ label: string; geo: ReturnType<typeof violationSummary>; q: ReturnType<typeof assessArchitecturalQuality> }> = [];
    for (const { label, payload } of BRIEFS) {
      const bp = await produce(payload);
      const geo = violationSummary(validateBlueprint(bp));
      const q = assessArchitecturalQuality(bp);
      rows.push({ label, geo, q });
    }

    const pad = (s: string | number, n: number) => String(s).padEnd(n);
    const source = USE_AI ? 'LIVE AI (ai-generate-optimal)' : 'procedural baseline';
    const lines: string[] = [];
    lines.push('');
    lines.push(`═══ ARCHITECTURAL QUALITY REPORT (source: ${source}) ═══`);
    lines.push(pad('Brief', 24) + pad('Circ', 6) + pad('Day', 6) + pad('Struct', 8) + pad('Adj', 6) + pad('Overall', 9) + pad('GeoCrit', 9));
    lines.push('─'.repeat(68));
    for (const { label, geo, q } of rows) {
      lines.push(
        pad(label, 24) + pad(q.circulation.score, 6) + pad(q.daylightCode.score, 6) +
        pad(q.structural.score, 8) + pad(q.adjacency.score, 6) + pad(q.overall, 9) + pad(geo.critical, 9),
      );
    }
    lines.push('─'.repeat(68));

    const avg = (sel: (r: typeof rows[number]) => number) => Math.round(rows.reduce((s, r) => s + sel(r), 0) / rows.length);
    const rate = (sel: (r: typeof rows[number]) => number) => Math.round((rows.filter((r) => sel(r) >= PASS).length / rows.length) * 100);

    lines.push(
      pad('AVERAGE', 24) + pad(avg((r) => r.q.circulation.score), 6) + pad(avg((r) => r.q.daylightCode.score), 6) +
      pad(avg((r) => r.q.structural.score), 8) + pad(avg((r) => r.q.adjacency.score), 6) + pad(avg((r) => r.q.overall), 9),
    );
    lines.push(
      pad(`PASS RATE (≥${PASS})`, 24) + pad(rate((r) => r.q.circulation.score) + '%', 6) + pad(rate((r) => r.q.daylightCode.score) + '%', 6) +
      pad(rate((r) => r.q.structural.score) + '%', 8) + pad(rate((r) => r.q.adjacency.score) + '%', 6) + pad(rate((r) => r.q.overall) + '%', 9),
    );
    lines.push('═'.repeat(68));

    const withIssues = rows.find((r) =>
      r.q.circulation.issues.length || r.q.daylightCode.issues.length || r.q.structural.issues.length || r.q.adjacency.issues.length,
    );
    if (withIssues) {
      lines.push(`Example issues — ${withIssues.label}:`);
      for (const cat of ['circulation', 'daylightCode', 'structural', 'adjacency'] as const) {
        for (const issue of withIssues.q[cat].issues.slice(0, 3)) lines.push(`  • [${cat}] ${issue}`);
      }
    }

    const report = lines.join('\n');
    // eslint-disable-next-line no-console
    console.log(report);
    try { writeFileSync('quality-report.txt', report + '\n'); } catch { /* ignore in restricted envs */ }

    for (const { q } of rows) {
      expect(q.overall).toBeGreaterThanOrEqual(0);
      expect(q.overall).toBeLessThanOrEqual(100);
    }
  }, USE_AI ? 900_000 : 30_000); // live AI: up to 15 min for 8 generations
});
