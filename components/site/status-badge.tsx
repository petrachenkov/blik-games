import { Snowflake, Radio, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TournamentStatus, GameStatus } from "@/lib/types";
import { TOURNAMENT_STATUS_LABELS, GAME_STATUS_LABELS } from "@/lib/types";

export function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const styles: Record<TournamentStatus, string> = {
    registration: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ongoing: "bg-red-500/15 text-red-400 border-red-500/30",
    frozen: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    finished: "bg-white/10 text-muted-foreground border-white/15",
    draft: "bg-white/5 text-muted-foreground border-white/10",
    registration_closed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    cancelled: "bg-white/5 text-muted-foreground border-white/10 line-through",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[status]
      )}
    >
      {status === "registration" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      )}
      {status === "ongoing" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
        </span>
      )}
      {status === "frozen" && <Snowflake className="h-3 w-3" />}
      {status === "finished" && <CheckCircle2 className="h-3 w-3" />}
      {(status === "draft" || status === "registration_closed") && <Circle className="h-3 w-3" />}
      {TOURNAMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function GameStatusBadge({ status }: { status: GameStatus }) {
  if (status === "active") return null;
  const styles: Record<GameStatus, string> = {
    active: "",
    frozen: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    hidden: "bg-white/10 text-muted-foreground border-white/15",
    archived: "bg-white/5 text-muted-foreground border-white/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[status]
      )}
    >
      {status === "frozen" && <Snowflake className="h-3 w-3" />}
      {GAME_STATUS_LABELS[status]}
    </span>
  );
}
