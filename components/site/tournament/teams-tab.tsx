import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { telegramUrl } from "@/lib/utils";
import { TEAM_STATUS_LABELS } from "@/lib/types";
import type { Team } from "@/lib/types";

const statusVariant: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
  approved: "success",
  pending: "outline",
  rejected: "destructive",
  disqualified: "destructive",
};

export function TeamsTab({ teams }: { teams: Team[] }) {
  const approved = teams.filter((t) => t.status !== "rejected");

  if (approved.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
        Пока нет зарегистрированных команд.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {approved.map((team) => (
        <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={team.logo_url ?? undefined} alt={team.name} />
                <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-display font-bold">{team.name}</span>
            </div>
            <Badge variant={statusVariant[team.status]}>{TEAM_STATUS_LABELS[team.status]}</Badge>
          </div>
          <a
            href={telegramUrl(team.captain_telegram)}
            target="_blank"
            rel="noreferrer"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Send className="h-3.5 w-3.5" /> Капитан: @{team.captain_telegram.replace(/^@/, "")}
          </a>
          <div className="space-y-1.5 border-t border-white/10 pt-3">
            {(team.players ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className={p.is_substitute ? "text-muted-foreground" : ""}>
                  {p.full_name} {p.is_substitute && "(запасной)"}
                </span>
                <a
                  href={telegramUrl(p.telegram)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  @{p.telegram.replace(/^@/, "")}
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
