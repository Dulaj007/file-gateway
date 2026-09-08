import { db } from "@/lib/db";

export type AuditAction = "upload" | "download" | "admin_login" | "delete";

// Best-effort and fire-and-forget in spirit: a logging failure must never
// break the real request it's describing, so this swallows its own errors
// rather than letting a broken AuditLog write take down an upload/download.
export async function logAudit(
  action: AuditAction,
  detail?: string | null,
  ip?: string | null
): Promise<void> {
  await db.auditLog
    .create({ data: { action, detail: detail ?? null, ip: ip ?? null } })
    .catch((err) => {
      console.error("[audit] failed to log:", action, err);
    });
}
