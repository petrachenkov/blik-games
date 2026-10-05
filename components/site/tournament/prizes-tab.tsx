import { Trophy, Medal, Award } from "lucide-react";

export function PrizesTab({ prizeInfo, accentColor }: { prizeInfo: string; accentColor: string }) {
  if (!prizeInfo.trim()) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
        Информация о призах скоро появится.
      </div>
    );
  }

  const icons = [Trophy, Medal, Award];
  const lines = prizeInfo.split("\n").filter(Boolean);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {lines.slice(0, 3).map((line, i) => {
        const Icon = icons[i] ?? Award;
        return (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <Icon className="mx-auto mb-3 h-8 w-8" style={{ color: accentColor }} />
            <p className="text-sm">{line}</p>
          </div>
        );
      })}
      {lines.length > 3 && (
        <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
          {lines.slice(3).join(" · ")}
        </div>
      )}
    </div>
  );
}
