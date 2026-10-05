import { redirect } from "next/navigation";
import { Pin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnnouncementFormDialog } from "@/components/admin/announcement-form-dialog";
import { DeleteAnnouncementButton } from "@/components/admin/delete-announcement-button";
import { requireProfile, getAllowedGameIds } from "@/lib/auth";
import { getAllGamesAdmin } from "@/lib/data/games";
import { inArray, desc } from "drizzle-orm";
import { db, announcements as announcementsTable } from "@/db";
import { formatDate } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  const profile = await requireProfile();
  if (profile.role === "judge") redirect("/admin/appeals");
  const allowed = await getAllowedGameIds(profile);
  const allGames = await getAllGamesAdmin();
  const games = allowed === "all" ? allGames : allGames.filter((g) => allowed.includes(g.id));

  const gameIds = games.map((g) => g.id);
  const announcements = await db.query.announcements.findMany({
    where: allowed === "all" ? undefined : inArray(announcementsTable.game_id, gameIds.length ? gameIds : ["00000000-0000-0000-0000-000000000000"]),
    with: { games: { columns: { name: true, accent_color: true } } },
    orderBy: [desc(announcementsTable.is_pinned), desc(announcementsTable.created_at)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Объявления</h1>
        <AnnouncementFormDialog
          games={games}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Новое объявление
            </Button>
          }
        />
      </div>

      <div className="space-y-3">
        {(announcements ?? []).map((a: any) => (
          <div key={a.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs">
                {a.is_pinned && <Pin className="h-3.5 w-3.5 text-violet-400" />}
                <span style={{ color: a.games?.accent_color }}>{a.games?.name ?? "Общее"}</span>
                <span className="text-muted-foreground">{formatDate(a.created_at)}</span>
              </div>
              <div className="font-medium">{a.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AnnouncementFormDialog
                games={games}
                announcement={a}
                trigger={
                  <Button variant="outline" size="sm">
                    Изменить
                  </Button>
                }
              />
              <DeleteAnnouncementButton id={a.id} />
            </div>
          </div>
        ))}
        {(announcements ?? []).length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
            Объявлений пока нет.
          </div>
        )}
      </div>
    </div>
  );
}
