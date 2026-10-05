import type { StandingRow } from "@/lib/standings";

export function StandingsTable({ standings, accentColor }: { standings: StandingRow[]; accentColor: string }) {
  if (standings.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left">Команда</th>
            <th className="px-3 py-2 text-center">И</th>
            <th className="px-3 py-2 text-center">В</th>
            <th className="px-3 py-2 text-center">П</th>
            <th className="px-3 py-2 text-center">Разница</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.teamId} className="border-b border-white/5 last:border-0">
              <td className="px-3 py-2 font-medium">
                <span className="mr-2 text-xs text-muted-foreground">{i + 1}.</span>
                {row.teamName}
              </td>
              <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{row.played}</td>
              <td className="px-3 py-2 text-center font-semibold tabular-nums" style={{ color: accentColor }}>
                {row.wins}
              </td>
              <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{row.losses}</td>
              <td className="px-3 py-2 text-center tabular-nums">
                {row.scoreDiff > 0 ? `+${row.scoreDiff}` : row.scoreDiff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
