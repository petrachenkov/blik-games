import { Badge } from "@/components/ui/badge";
import { ModeBadge } from "@/components/site/mode-badge";
import { formatDateTime, winsWord } from "@/lib/utils";
import type { Match } from "@/lib/types";

const statusLabels: Record<string, string> = {
  scheduled: "Запланирован",
  live: "Идёт",
  finished: "Завершён",
};

export function MatchesTab({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
        Матчи ещё не запланированы.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div key={match.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Раунд {match.round}</span>
              <span>·</span>
              <span>до {match.win_target} {winsWord(match.win_target)}</span>
              <span>·</span>
              <span>{formatDateTime(match.scheduled_at)}</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm font-medium">
              <span>{match.team_a?.name ?? "TBD"}</span>
              <span className="font-display font-bold tabular-nums">
                {match.status === "finished" ? `${match.score_a ?? 0} : ${match.score_b ?? 0}` : "vs"}
              </span>
              <span>{match.team_b?.name ?? "TBD"}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Badge variant={match.status === "live" ? "destructive" : "outline"}>
                {statusLabels[match.status]}
              </Badge>
            </div>
          </div>
          {match.modes_plan && match.modes_plan.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
              {match.modes_plan.map((entry, i) => (
                <ModeBadge key={i} mode={entry.mode} map={entry.map} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
