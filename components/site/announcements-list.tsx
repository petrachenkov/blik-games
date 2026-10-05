import { Pin, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  games?: { name: string; accent_color: string } | null;
}

export function AnnouncementsSection({ announcements }: { announcements: AnnouncementItem[] }) {
  if (announcements.length === 0) return null;

  return (
    <section className="container py-12">
      <div className="mb-6 flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-violet-400" />
        <h2 className="font-display text-2xl font-bold">Объявления</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {announcements.slice(0, 6).map((a) => (
          <Card key={a.id} className={a.is_pinned ? "border-violet-500/30" : undefined}>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {a.is_pinned && <Pin className="h-3.5 w-3.5 text-violet-400" />}
                  {a.games ? (
                    <span style={{ color: a.games.accent_color }}>{a.games.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Общее</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
              </div>
              <h3 className="mb-1 font-display text-base font-bold">{a.title}</h3>
              <p className="line-clamp-3 text-sm text-muted-foreground">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
