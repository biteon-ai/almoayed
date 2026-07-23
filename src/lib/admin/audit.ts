import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAdminAuditLog(input: {
  adminId: string;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("admin_audit_log").insert({
    admin_id: input.adminId,
    action: input.action,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });
}
