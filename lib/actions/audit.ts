import { db, audit_log } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function logAction(
  action: string,
  entityType: string,
  entityId: string | null,
  payload: Record<string, unknown> = {}
) {
  const user = await getCurrentUser();

  await db.insert(audit_log).values({
    user_id: user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    payload,
  });
}
