export interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  scoreDiff: number;
}

interface MinimalMatch {
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
}

interface MinimalTeam {
  id: string;
  name: string;
}

/** Считает таблицу (И/В/П/Разница) по завершённым матчам группы/кругового турнира. */
export function computeStandings(teams: MinimalTeam[], matches: MinimalMatch[]): StandingRow[] {
  const rows: StandingRow[] = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    played: 0,
    wins: 0,
    losses: 0,
    scoreDiff: 0,
  }));
  const byId = new Map(rows.map((r) => [r.teamId, r]));

  for (const m of matches) {
    if (m.status !== "finished") continue;
    const a = m.team_a_id ? byId.get(m.team_a_id) : undefined;
    const b = m.team_b_id ? byId.get(m.team_b_id) : undefined;
    const scoreA = m.score_a ?? 0;
    const scoreB = m.score_b ?? 0;
    if (a) {
      a.played++;
      a.scoreDiff += scoreA - scoreB;
      if (scoreA > scoreB) a.wins++;
      else if (scoreA < scoreB) a.losses++;
    }
    if (b) {
      b.played++;
      b.scoreDiff += scoreB - scoreA;
      if (scoreB > scoreA) b.wins++;
      else if (scoreB < scoreA) b.losses++;
    }
  }

  return rows.sort((x, y) => y.wins - x.wins || y.scoreDiff - x.scoreDiff);
}
