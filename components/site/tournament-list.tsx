"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TournamentStatusBadge } from "@/components/site/status-badge";
import { TOURNAMENT_FORMAT_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import type { Tournament } from "@/lib/types";

type Filter = "active" | "upcoming" | "finished";

function matchesFilter(t: Tournament, filter: Filter) {
  if (filter === "active") return t.status === "registration" || t.status === "ongoing" || t.status === "frozen";
  if (filter === "upcoming") return t.status === "draft" || t.status === "registration_closed";
  return t.status === "finished" || t.status === "cancelled";
}

export function TournamentList({
  tournaments,
  gameSlug,
  accentColor,
}: {
  tournaments: Tournament[];
  gameSlug: string;
  accentColor: string;
}) {
  const [filter, setFilter] = useState<Filter>("active");
  const filtered = useMemo(() => tournaments.filter((t) => matchesFilter(t, filter)), [tournaments, filter]);

  return (
    <div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="upcoming">Предстоящие</TabsTrigger>
          <TabsTrigger value="finished">Завершённые</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
            Турниров в этой категории пока нет.
          </div>
        )}
        {filtered.map((t) => (
          <Link key={t.id} href={`/${gameSlug}/${t.slug}`}>
            <Card className="h-full transition-transform hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <TournamentStatusBadge status={t.status} />
                  <span className="text-xs text-muted-foreground">
                    {TOURNAMENT_FORMAT_LABELS[t.format]}
                  </span>
                </div>
                <h3 className="mb-1 font-display text-lg font-bold">{t.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Старт: {formatDate(t.starts_at)}</span>
                  <span style={{ color: accentColor }}>До {t.max_teams} команд</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
