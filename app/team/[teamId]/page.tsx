import { notFound } from "next/navigation";
import { Send, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModeBadge } from "@/components/site/mode-badge";
import { TeamStatusBadge } from "@/components/team/team-status-badge";
import { MatchResultForm } from "@/components/team/match-result-form";
import { AppealForm } from "@/components/team/appeal-form";
import { requireCaptainUser } from "@/lib/auth";
import { getCaptainTeamDetail } from "@/lib/data/captain";
import { telegramUrl, formatDateTime, winsWord } from "@/lib/utils";
import { MATCH_RESULT_STATUS_LABELS, APPEAL_STATUS_LABELS } from "@/lib/types";

export default async function CaptainTeamDetailPage({ params }: { params: { teamId: string } }) {
  const user = await requireCaptainUser();
  const detail = await getCaptainTeamDetail(params.teamId, user.id);
  if (!detail) notFound();

  const { team, matches, results, appeals } = detail;
  const game = team.tournaments?.games;

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm" style={{ color: game?.accent_color }}>
          {game?.name} · {team.tournaments?.title}
        </div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold">{team.name}</h1>
          <TeamStatusBadge status={team.status} />
        </div>
        {team.status === "rejected" && team.reject_reason && (
          <p className="mt-2 max-w-lg rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            Причина отклонения: {team.reject_reason}
          </p>
        )}
        {team.status === "disqualified" && team.reject_reason && (
          <p className="mt-2 max-w-lg rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            Причина дисквалификации: {team.reject_reason}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Состав команды</h2>
          <div className="space-y-2">
            {(team.players ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  {p.full_name} {p.is_substitute && <span className="text-muted-foreground">(запасной)</span>}
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
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Trophy className="h-5 w-5" /> Матчи
        </h2>
        <div className="space-y-4">
          {matches.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-muted-foreground">
              Матчи ещё не назначены.
            </div>
          )}
          {matches.map((match: any) => {
            const ownResult = results.find((r: any) => r.match_id === match.id && r.submitted_by_team_id === team.id);
            const ownAppeal = appeals.find((a: any) => a.match_id === match.id && a.submitted_by_team_id === team.id);
            const opponent = match.team_a_id === team.id ? match.team_b : match.team_a;

            return (
              <Card key={match.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      Раунд {match.round} · vs {opponent?.name ?? "TBD"} · до {match.win_target} {winsWord(match.win_target)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(match.scheduled_at)}</span>
                  </div>

                  {match.modes_plan && match.modes_plan.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {match.modes_plan.map((entry: any, i: number) => (
                        <ModeBadge key={i} mode={entry.mode} map={entry.map} />
                      ))}
                    </div>
                  )}

                  {match.status === "finished" ? (
                    <div className="font-display text-lg font-bold tabular-nums">
                      {match.score_a} : {match.score_b}
                    </div>
                  ) : ownResult ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{MATCH_RESULT_STATUS_LABELS[ownResult.status as keyof typeof MATCH_RESULT_STATUS_LABELS]}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Заявлено: {ownResult.score_a} : {ownResult.score_b}
                      </span>
                    </div>
                  ) : (
                    <MatchResultForm matchId={match.id} teamId={team.id} />
                  )}

                  {ownResult && !ownAppeal && (
                    <AppealForm matchId={match.id} teamId={team.id} />
                  )}
                  {ownAppeal && (
                    <div className="text-sm text-muted-foreground">
                      Апелляция: {APPEAL_STATUS_LABELS[ownAppeal.status as keyof typeof APPEAL_STATUS_LABELS]}
                      {ownAppeal.resolution_notes && ` — ${ownAppeal.resolution_notes}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
