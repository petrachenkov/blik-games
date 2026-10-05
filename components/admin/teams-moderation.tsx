"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Check, X, Ban, Trash2, Send, Shuffle, ChevronDown, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { approveTeam, rejectTeam, disqualifyTeam, deleteTeam, assignGroup, drawGroups } from "@/lib/actions/teams";
import { TEAM_STATUS_LABELS } from "@/lib/types";
import { telegramUrl } from "@/lib/utils";
import type { Team, PlayerFieldConfig } from "@/lib/types";

const statusVariant: Record<string, "success" | "outline" | "destructive"> = {
  approved: "success",
  pending: "outline",
  rejected: "destructive",
  disqualified: "destructive",
};

export function TeamsModeration({
  tournamentId,
  teams,
  playerFields = [],
}: {
  tournamentId: string;
  teams: Team[];
  playerFields?: PlayerFieldConfig[];
}) {
  const router = useRouter();
  const [groupCount, setGroupCount] = useState(4);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const fieldLabels = Object.fromEntries(playerFields.map((f) => [f.key, f.label]));

  function toggle(teamId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  async function handleApprove(teamId: string) {
    const result = await approveTeam(teamId, tournamentId);
    if ("error" in result && result.error) toast.error(result.error);
    else {
      toast.success("Команда принята");
      router.refresh();
    }
  }

  async function handleDrawGroups() {
    const result = await drawGroups(tournamentId, groupCount);
    if ("error" in result && result.error) toast.error(result.error);
    else {
      toast.success("Жеребьёвка проведена");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Команды ({teams.length})</h2>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={2}
            max={16}
            value={groupCount}
            onChange={(e) => setGroupCount(Number(e.target.value))}
            className="h-9 w-16"
          />
          <Button variant="outline" size="sm" onClick={handleDrawGroups}>
            <Shuffle className="h-3.5 w-3.5" /> Жеребьёвка групп
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Команда</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Капитан</TableHead>
            <TableHead>Группа</TableHead>
            <TableHead>Игроки</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const isOpen = expanded.has(team.id);
            return (
              <Fragment key={team.id}>
                <TableRow className="cursor-pointer" onClick={() => toggle(team.id)}>
                  <TableCell className="w-8 pr-0">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[team.status]}>{TEAM_STATUS_LABELS[team.status]}</Badge>
                    {team.reject_reason && (
                      <div className="mt-1 text-xs text-muted-foreground">{team.reject_reason}</div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <a
                      href={telegramUrl(team.captain_telegram)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Send className="h-3 w-3" /> @{team.captain_telegram.replace(/^@/, "")}
                    </a>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Input
                      defaultValue={team.group_label ?? ""}
                      placeholder="—"
                      className="h-8 w-28"
                      onBlur={(e) => {
                        if (e.target.value !== (team.group_label ?? "")) {
                          assignGroup(team.id, tournamentId, e.target.value).then((r) => {
                            if ("error" in r && r.error) toast.error(r.error);
                            else router.refresh();
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {team.players?.length ?? 0}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      {team.status === "pending" && (
                        <>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleApprove(team.id)}>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          </Button>
                          <ReasonDialog
                            title="Отклонить заявку"
                            confirmLabel="Отклонить"
                            destructive
                            onConfirm={(reason) => rejectTeam(team.id, tournamentId, reason).then((r) => { router.refresh(); return r; })}
                            trigger={
                              <Button size="icon" variant="outline" className="h-8 w-8">
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            }
                          />
                        </>
                      )}
                      {team.status === "approved" && (
                        <ReasonDialog
                          title="Дисквалифицировать команду"
                          confirmLabel="Дисквалифицировать"
                          destructive
                          onConfirm={(reason) => disqualifyTeam(team.id, tournamentId, reason).then((r) => { router.refresh(); return r; })}
                          trigger={
                            <Button size="icon" variant="outline" className="h-8 w-8">
                              <Ban className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          }
                        />
                      )}
                      <ConfirmDeleteDialog
                        entityName={team.name}
                        onConfirm={() => deleteTeam(team.id, tournamentId).then((r) => { router.refresh(); return r; })}
                        trigger={
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="bg-white/[0.02] p-0">
                      {team.players && team.players.length > 0 ? (
                        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          {team.players.map((p) => (
                            <div
                              key={p.id}
                              className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{p.full_name}</span>
                                {p.is_substitute && (
                                  <Badge variant="outline" className="text-[10px]">
                                    Запасной
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">{p.study_group}</div>
                              <a
                                href={telegramUrl(p.telegram)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <Send className="h-3 w-3" /> @{p.telegram.replace(/^@/, "")}
                              </a>
                              {p.game_data && Object.keys(p.game_data).length > 0 && (
                                <div className="mt-2 space-y-0.5 border-t border-white/10 pt-2">
                                  {Object.entries(p.game_data).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">{fieldLabels[key] ?? key}</span>
                                      <span className="font-mono">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="p-4 text-sm text-muted-foreground">Игроки не указаны.</p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {teams.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Заявок пока нет.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
