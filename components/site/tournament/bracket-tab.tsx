import { cn, winsWord } from "@/lib/utils";
import { computeStandings } from "@/lib/standings";
import { StandingsTable } from "@/components/site/standings-table";
import type { Match } from "@/lib/types";

export function BracketTab({ matches, accentColor }: { matches: Match[]; accentColor: string }) {
  const playoffMatches = matches.filter((m) => m.stage === "playoff");
  const groupMatches = matches.filter((m) => m.stage === "group");

  if (playoffMatches.length === 0 && groupMatches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
        Сетка турнира ещё не сформирована.
      </div>
    );
  }

  const rounds = Array.from(new Set(playoffMatches.map((m) => m.round))).sort((a, b) => a - b);

  const groups = groupMatches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.team_a?.group_label || m.team_b?.group_label || "Группа";
    acc[key] = acc[key] ?? [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.keys(groups).length > 0 && (
        <div>
          <h3 className="mb-4 font-display text-lg font-bold">
            {Object.keys(groups).length === 1 && groups["Группа"] ? "Турнирная таблица" : "Групповой этап"}
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(groups).map(([label, ms]) => {
              const teamMap = new Map<string, { id: string; name: string }>();
              for (const m of ms) {
                if (m.team_a_id && m.team_a) teamMap.set(m.team_a_id, { id: m.team_a_id, name: m.team_a.name });
                if (m.team_b_id && m.team_b) teamMap.set(m.team_b_id, { id: m.team_b_id, name: m.team_b.name });
              }
              const standings = computeStandings(Array.from(teamMap.values()), ms);

              return (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-sm font-semibold" style={{ color: accentColor }}>
                    {label}
                  </div>
                  <StandingsTable standings={standings} accentColor={accentColor} />
                  <div className="mt-3 space-y-2">
                    {ms.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <span>{m.team_a?.name ?? "TBD"}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {m.status === "finished" ? `${m.score_a ?? 0}:${m.score_b ?? 0}` : "vs"}
                        </span>
                        <span>{m.team_b?.name ?? "TBD"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rounds.length > 0 && (
        <div>
          <h3 className="mb-4 font-display text-lg font-bold">Плей-офф</h3>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {rounds.map((round) => (
              <div key={round} className="flex min-w-[220px] flex-col justify-around gap-4">
                <div className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Раунд {round}
                </div>
                {playoffMatches
                  .filter((m) => m.round === round)
                  .map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-xl border bg-white/[0.03] p-3",
                        m.status === "finished" ? "border-white/10" : "border-white/10"
                      )}
                      style={m.status === "live" ? { borderColor: accentColor } : undefined}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={
                            m.status === "finished" && (m.score_a ?? 0) > (m.score_b ?? 0) ? "font-bold" : ""
                          }
                        >
                          {m.team_a?.name ?? "TBD"}
                        </span>
                        <span className="tabular-nums text-muted-foreground">{m.score_a ?? "-"}</span>
                      </div>
                      <div className="my-1 h-px bg-white/10" />
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={
                            m.status === "finished" && (m.score_b ?? 0) > (m.score_a ?? 0) ? "font-bold" : ""
                          }
                        >
                          {m.team_b?.name ?? "TBD"}
                        </span>
                        <span className="tabular-nums text-muted-foreground">{m.score_b ?? "-"}</span>
                      </div>
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        до {m.win_target} {winsWord(m.win_target)}
                        {m.modes_plan && m.modes_plan.length > 0 && ` · ${m.modes_plan.length} режима`}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
