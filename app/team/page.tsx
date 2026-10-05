import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TeamStatusBadge } from "@/components/team/team-status-badge";
import { requireCaptainUser } from "@/lib/auth";
import { getCaptainTeams } from "@/lib/data/captain";

export default async function CaptainTeamsPage() {
  const user = await requireCaptainUser();
  const teams = await getCaptainTeams(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Мои команды</h1>
        <p className="text-sm text-muted-foreground">
          Команды, которые вы зарегистрировали как капитан.
        </p>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <Users className="h-8 w-8" />
            <p>Вы ещё не зарегистрировали ни одной команды.</p>
            <Link href="/" className="text-sm font-medium text-violet-400 hover:underline">
              Перейти к списку турниров →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Link key={team.id} href={`/team/${team.id}`}>
              <Card className="h-full transition-transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="mb-2 text-xs" style={{ color: team.tournaments?.games?.accent_color }}>
                    {team.tournaments?.games?.name}
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-display font-bold">{team.name}</h3>
                    <TeamStatusBadge status={team.status} />
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{team.tournaments?.title}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-violet-400">
                    Управлять командой <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
