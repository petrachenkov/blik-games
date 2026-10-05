import { redirect } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { requireProfile } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { db, audit_log } from "@/db";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditLogPage() {
  const profile = await requireProfile();
  if (profile.role !== "superadmin") redirect("/admin");

  const entries = await db.query.audit_log.findMany({
    with: { profiles: { columns: { display_name: true } } },
    orderBy: desc(audit_log.created_at),
    limit: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Журнал действий</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Время</TableHead>
            <TableHead>Пользователь</TableHead>
            <TableHead>Действие</TableHead>
            <TableHead>Объект</TableHead>
            <TableHead>Детали</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(entries ?? []).map((entry: any) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTime(entry.created_at)}
              </TableCell>
              <TableCell className="text-sm">{entry.profiles?.display_name ?? "—"}</TableCell>
              <TableCell className="text-sm font-medium">{entry.action}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {entry.entity_type}
                {entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ""}
              </TableCell>
              <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                {JSON.stringify(entry.payload)}
              </TableCell>
            </TableRow>
          ))}
          {(entries ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Записей пока нет.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
