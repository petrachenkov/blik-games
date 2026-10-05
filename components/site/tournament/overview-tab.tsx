import { Users, Calendar, Trophy, Layers, Crown } from "lucide-react";
import { TOURNAMENT_FORMAT_LABELS } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import type { Tournament, Team } from "@/lib/types";

export function OverviewTab({
  tournament,
  teamsCount,
  champion,
  accentColor,
}: {
  tournament: Tournament;
  teamsCount: number;
  champion?: Team | null;
  accentColor?: string;
}) {
  const items = [
    { icon: Layers, label: "Формат", value: TOURNAMENT_FORMAT_LABELS[tournament.format] },
    { icon: Users, label: "Команды", value: `${teamsCount} / ${tournament.max_teams}` },
    { icon: Calendar, label: "Старт", value: formatDateTime(tournament.starts_at) },
    { icon: Trophy, label: "Призы", value: tournament.prize_info || "Уточняется" },
  ];

  return (
    <div className="space-y-8">
      {tournament.status === "finished" && champion && (
        <div
          className="flex items-center gap-4 rounded-2xl border p-5"
          style={{ borderColor: `${accentColor}40`, background: `${accentColor}1a` }}
        >
          <Crown className="h-10 w-10 shrink-0" style={{ color: accentColor }} />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Турнир завершён — чемпион</div>
            <div className="font-display text-2xl font-bold">{champion.name}</div>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <item.icon className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="mt-1 truncate font-medium">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground">
        {tournament.description || "Описание турнира скоро появится."}
      </div>
    </div>
  );
}
