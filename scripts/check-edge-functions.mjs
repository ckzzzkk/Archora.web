#!/usr/bin/env node
/**
 * Parse-only syntax gate for Supabase edge functions.
 *
 * The app's tsconfig excludes supabase/ (it's Deno), so nothing locally catches
 * a syntax error in an edge function — it only surfaces at `supabase functions
 * deploy` time (e.g. an unbalanced template literal that makes a whole function
 * undeployable). This script transpiles every edge-function .ts file with the
 * TypeScript compiler WITHOUT type-checking (same as the deploy bundler), so it
 * flags syntax errors only — no false positives from Deno/esm.sh type quirks.
 *
 * Usage: node scripts/check-edge-functions.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const ROOT = 'supabase/functions';
if (!existsSync(ROOT)) {
  console.error(`No ${ROOT} directory — nothing to check.`);
  process.exit(0);
}

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.ts')) files.push(p);
  }
})(ROOT);

let failed = 0;
for (const f of files) {
  const code = readFileSync(f, 'utf8');
  const { diagnostics = [] } = ts.transpileModule(code, {
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
  });
  const errors = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    failed++;
    for (const d of errors) {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      console.error(`✗ ${f} (offset ${d.start ?? '?'}) — ${msg}`);
    }
  }
}

if (failed) {
  console.error(`\n✗ ${failed} edge-function file(s) have syntax errors — they will fail to deploy.`);
  process.exit(1);
}
console.log(`✓ ${files.length} edge-function files parsed cleanly.`);
