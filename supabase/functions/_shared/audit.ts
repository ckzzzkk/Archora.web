import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireEnv } from './errors.ts';

export type AuditAction =
  | 'ai_generate'
  | 'ai_furniture'
  | 'ar_scan'
  | 'ar_scan_status_polled'
  | 'ar_reconstruct'
  | 'texture_generated'
  | 'audio_transcribed'
  | 'stripe_checkout'
  | 'stripe_webhook'
  | 'stripe_cancel'
  | 'stripe_sync'
  | 'template_publish'
  | 'template_download'
  | 'project_create'
  | 'project_delete'
  | 'account_deleted'
  | 'data_exported'
  | 'login_success'
  | 'stripe_portal'
  | 'furniture_image_generate';

export interface AuditEntry {
  user_id: string;
  action: AuditAction;
  resource_id?: string;
  resource_type?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      action: entry.action,
      resource_id: entry.resource_id ?? null,
      resource_type: entry.resource_type ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
    });
  } catch (err) {
    // Audit failures must never block the main request
    console.error('[audit] Failed to write audit log:', err);
  }
}

export function extractRequestMeta(req: Request): { ip: string | null; userAgent: string | null } {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: req.headers.get('user-agent'),
  };
}
