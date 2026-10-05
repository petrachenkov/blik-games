"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, Loader2, ListVideo, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeBadge } from "@/components/site/mode-badge";
import { StandingsTable } from "@/components/site/standings-table";
import { computeStandings } from "@/lib/standings";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import {
  createMatch,
  updateMatchScore,
  updateMatchModeResults,
  updateMatchPlan,
  deleteMatch,
  generateSingleEliminationBracket,
  generateGroupStage,
  generateRoundRobin,
  generatePlayoffFromGroups,
} from "@/lib/actions/matches";
import { cn, formatDateTime, winsWord } from "@/lib/utils";
import { getModeIcon } from "@/lib/mode-icons";
import { buildRandomModesPlan } from "@/lib/game-config-utils";
import type { Match, Team, ModesPlanEntry, TournamentFormat, GameConfig } from "@/lib/types";

function ModesPlanEditor({
  modes,
  gameConfig,
  value,
  onChange,
}: {
  modes: string[];
  gameConfig?: GameConfig;
  value: ModesPlanEntry[];
  onChange: (plan: ModesPlanEntry[]) => void;
}) {
  function update(index: number, key: keyof ModesPlanEntry, val: string) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, [key]: val } : entry)));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>План режимов и карт</Label>
        <div className="flex gap-2">
          {gameConfig?.mode_maps && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(buildRandomModesPlan(gameConfig))}
            >
              <Dices className="h-3.5 w-3.5" /> Случайно
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...value, { mode: modes[0] ?? "", map: "" }])}
          >
            <Plus className="h-3.5 w-3.5" /> Режим
          </Button>
        </div>
      </div>
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Режимы и карты не заданы — добавьте 2-3 режима (2 основных + решающий), известные заранее.
        </p>
      )}
      {value.map((entry, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          {modes.length > 0 ? (
            <Select value={entry.mode} onValueChange={(v) => update(i, "mode", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Режим" />
              </SelectTrigger>
              <SelectContent>
                {modes.map((m) => {
                  const icon = getModeIcon(m);
                  return (
                    <SelectItem key={m} value={m}>
                      <span className="flex items-center gap-2">
                        {icon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={icon} alt="" className="h-4 w-4 object-contain" />
                        )}
                        {m}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <Input placeholder="Режим" value={entry.mode} onChange={(e) => update(i, "mode", e.target.value)} />
          )}
          <Input placeholder="Карта" value={entry.map} onChange={(e) => update(i, "map", e.target.value)} />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function AddMatchDialog({
  tournamentId,
  teams,
  modes,
  gameConfig,
}: {
  tournamentId: string;
  teams: Team[];
  modes: string[];
  gameConfig?: GameConfig;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [round, setRound] = useState(1);
  const [stage, setStage] = useState<"group" | "playoff">("playoff");
  const [teamA, setTeamA] = useState<string>("");
  const [teamB, setTeamB] = useState<string>("");
  const [winTarget, setWinTarget] = useState(2);
  const [modesPlan, setModesPlan] = useState<ModesPlanEntry[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");

  const approved = teams.filter((t) => t.status === "approved");

  async function handleSave() {
    setSaving(true);
    const result = await createMatch(tournamentId, {
      round,
      stage,
      team_a_id: teamA || null,
      team_b_id: teamB || null,
      modesPlan,
      winTarget,
      scheduled_at: scheduledAt,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Матч добавлен");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Добавить матч
        </Button>
      </div>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый матч</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Раунд</Label>
              <Input type="number" min={1} value={round} onChange={(e) => setRound(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Стадия</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as "group" | "playoff")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Группа</SelectItem>
                  <SelectItem value="playoff">Плей-офф</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>До скольки побед</Label>
              <Input type="number" min={1} value={winTarget} onChange={(e) => setWinTarget(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Команда A</Label>
              <Select value={teamA} onValueChange={setTeamA}>
                <SelectTrigger>
                  <SelectValue placeholder="TBD" />
                </SelectTrigger>
                <SelectContent>
                  {approved.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Команда B</Label>
              <Select value={teamB} onValueChange={setTeamB}>
                <SelectTrigger>
                  <SelectValue placeholder="TBD" />
                </SelectTrigger>
                <SelectContent>
                  {approved.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ModesPlanEditor modes={modes} gameConfig={gameConfig} value={modesPlan} onChange={setModesPlan} />

          <div className="space-y-1.5">
            <Label>Дата и время</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toInputDateTime(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditPlanDialog({
  match,
  tournamentId,
  modes,
  gameConfig,
}: {
  match: Match;
  tournamentId: string;
  modes: string[];
  gameConfig?: GameConfig;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [winTarget, setWinTarget] = useState(match.win_target);
  const [modesPlan, setModesPlan] = useState<ModesPlanEntry[]>(match.modes_plan ?? []);
  const [scheduledAt, setScheduledAt] = useState(toInputDateTime(match.scheduled_at));

  async function handleSave() {
    setSaving(true);
    const result = await updateMatchPlan(match.id, tournamentId, { modesPlan, winTarget, scheduledAt });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Матч обновлён");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <ListVideo className="h-3.5 w-3.5" />
        </Button>
      </div>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Режимы, карты и время матча</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>До скольки побед</Label>
              <Input type="number" min={1} value={winTarget} onChange={(e) => setWinTarget(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Дата и время</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </div>
          <ModesPlanEditor modes={modes} gameConfig={gameConfig} value={modesPlan} onChange={setModesPlan} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function modeWinner(entry: ModesPlanEntry, teamAId: string | null, teamBId: string | null) {
  const a = entry.scoreA ?? 0;
  const b = entry.scoreB ?? 0;
  if (a === 0 && b === 0) return null;
  if (a > b) return teamAId;
  if (b > a) return teamBId;
  return null;
}

function ModeResultsEditor({ match, tournamentId }: { match: Match; tournamentId: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<ModesPlanEntry[]>(match.modes_plan ?? []);
  const [saving, setSaving] = useState(false);
  const [editingFinished, setEditingFinished] = useState(false);

  const isScheduled = match.status === "scheduled";
  const isFinished = match.status === "finished";
  const readOnly = isFinished && !editingFinished;
  // Поля ввода всегда на месте (кроме зафиксированного "завершён"), чтобы при смене
  // статуса карточка не меняла высоту и список матчей не "прыгал".
  const showInputs = !readOnly;

  const winners = plan.map((e) => modeWinner(e, match.team_a_id, match.team_b_id));
  const scoreA = winners.filter((w) => w && w === match.team_a_id).length;
  const scoreB = winners.filter((w) => w && w === match.team_b_id).length;
  const hasAnyWinner = winners.some((w) => w);
  const currentModeIndex = match.status === "live" ? winners.findIndex((w) => !w) : -1;

  function setModeScore(index: number, key: "scoreA" | "scoreB", value: number) {
    setPlan((prev) => prev.map((e, i) => (i === index ? { ...e, [key]: Math.max(0, value) } : e)));
  }

  async function saveStatus(status: "scheduled" | "live" | "finished") {
    setSaving(true);
    const finalPlan = plan.map((e) => ({ ...e, winnerTeamId: modeWinner(e, match.team_a_id, match.team_b_id) }));
    const result = await updateMatchModeResults(match.id, tournamentId, {
      modesPlan: finalPlan,
      teamAId: match.team_a_id,
      teamBId: match.team_b_id,
      status,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setEditingFinished(false);
    router.refresh();
  }

  function cancelEdit() {
    setPlan(match.modes_plan ?? []);
    setEditingFinished(false);
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {plan.map((entry, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
            <ModeBadge mode={entry.mode} map={entry.map} />
            {currentModeIndex === i && (
              <Badge variant="destructive" className="gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                сейчас играется
              </Badge>
            )}
            <span className="text-muted-foreground">{match.team_a?.name ?? "A"}</span>
            {showInputs && !readOnly ? (
              <Input
                type="number"
                min={0}
                max={match.win_target}
                disabled={!match.team_a_id}
                value={entry.scoreA ?? 0}
                onChange={(e) => setModeScore(i, "scoreA", Number(e.target.value))}
                className="h-7 w-14 text-center"
              />
            ) : (
              <span className="font-display font-bold tabular-nums">{showInputs ? entry.scoreA ?? 0 : "—"}</span>
            )}
            <span className="text-muted-foreground">:</span>
            {showInputs && !readOnly ? (
              <Input
                type="number"
                min={0}
                max={match.win_target}
                disabled={!match.team_b_id}
                value={entry.scoreB ?? 0}
                onChange={(e) => setModeScore(i, "scoreB", Number(e.target.value))}
                className="h-7 w-14 text-center"
              />
            ) : (
              <span className="font-display font-bold tabular-nums">{showInputs ? entry.scoreB ?? 0 : "—"}</span>
            )}
            <span className="text-muted-foreground">{match.team_b?.name ?? "B"}</span>
            {winners[i] && (
              <span className="text-[10px] uppercase tracking-wide text-emerald-400">
                реж. выиграл {winners[i] === match.team_a_id ? match.team_a?.name : match.team_b?.name}
              </span>
            )}
          </div>
        ))}
      </div>

      {!isFinished && (
        <p className="text-[11px] text-muted-foreground">
          {isScheduled
            ? `Можно внести ожидаемый счёт заранее — он сохранится, когда нажмёте «Начать матч».`
            : `Счёт игр внутри режима — кто первый дошёл до ${match.win_target} ${winsWord(match.win_target)}, тот выиграл режим.`}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {hasAnyWinner ? (
          <span className="font-display text-sm font-bold tabular-nums">
            Итого по режимам: {scoreA} : {scoreB}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Счёт ещё не внесён</span>
        )}

        {isScheduled && (
          <Button size="sm" variant="outline" disabled={saving} onClick={() => saveStatus("live")}>
            Начать матч
          </Button>
        )}

        {match.status === "live" && (
          <Button size="sm" variant="outline" disabled={saving || !hasAnyWinner} onClick={() => saveStatus("finished")}>
            Завершить
          </Button>
        )}

        {isFinished && !editingFinished && (
          <Button size="sm" variant="ghost" onClick={() => setEditingFinished(true)}>
            Изменить результат
          </Button>
        )}

        {isFinished && editingFinished && (
          <>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => saveStatus("finished")}>
              Сохранить изменения
            </Button>
            <Button size="sm" variant="ghost" disabled={saving} onClick={cancelEdit}>
              Отмена
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreEditor({ match, tournamentId }: { match: Match; tournamentId: string }) {
  const router = useRouter();
  const [scoreA, setScoreA] = useState(match.score_a ?? 0);
  const [scoreB, setScoreB] = useState(match.score_b ?? 0);
  const [saving, setSaving] = useState(false);
  const [editingFinished, setEditingFinished] = useState(false);

  const isScheduled = match.status === "scheduled";
  const isFinished = match.status === "finished";
  const readOnly = isFinished && !editingFinished;

  async function saveStatus(status: "scheduled" | "live" | "finished") {
    setSaving(true);
    const result = await updateMatchScore(match.id, tournamentId, scoreA, scoreB, status);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setEditingFinished(false);
    router.refresh();
  }

  function cancelEdit() {
    setScoreA(match.score_a ?? 0);
    setScoreB(match.score_b ?? 0);
    setEditingFinished(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {readOnly ? (
        <span className="font-display text-sm font-bold tabular-nums">
          {scoreA} : {scoreB}
        </span>
      ) : (
        <>
          <Input
            type="number"
            value={scoreA}
            onChange={(e) => setScoreA(Number(e.target.value))}
            className="h-8 w-14 text-center"
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            value={scoreB}
            onChange={(e) => setScoreB(Number(e.target.value))}
            className="h-8 w-14 text-center"
          />
        </>
      )}

      {isScheduled && (
        <Button size="sm" variant="outline" disabled={saving} onClick={() => saveStatus("live")}>
          Начать матч
        </Button>
      )}
      {match.status === "live" && (
        <Button size="sm" variant="outline" disabled={saving} onClick={() => saveStatus("finished")}>
          Завершить
        </Button>
      )}
      {isFinished && !editingFinished && (
        <Button size="sm" variant="ghost" onClick={() => setEditingFinished(true)}>
          Изменить результат
        </Button>
      )}
      {isFinished && editingFinished && (
        <>
          <Button size="sm" variant="outline" disabled={saving} onClick={() => saveStatus("finished")}>
            Сохранить изменения
          </Button>
          <Button size="sm" variant="ghost" disabled={saving} onClick={cancelEdit}>
            Отмена
          </Button>
        </>
      )}
    </div>
  );
}

function GenerateControls({ tournamentId, format }: { tournamentId: string; format: TournamentFormat }) {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);
  const [advancePerGroup, setAdvancePerGroup] = useState(2);

  async function run(key: string, action: () => Promise<{ error?: string } | void>, successMsg: string) {
    setGenerating(key);
    const result = await action();
    setGenerating(null);
    if (result && "error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(successMsg);
    router.refresh();
  }

  if (format === "single_elimination") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={generating !== null}
        onClick={() =>
          run(
            "bracket",
            () => generateSingleEliminationBracket(tournamentId),
            "Сетка сгенерирована (1-й раунд), последующие раунды заполняйте вручную"
          )
        }
      >
        {generating === "bracket" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
        Сгенерировать сетку
      </Button>
    );
  }

  if (format === "round_robin") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={generating !== null}
        onClick={() =>
          run("roundrobin", () => generateRoundRobin(tournamentId), "Круговое расписание сгенерировано")
        }
      >
        {generating === "roundrobin" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
        Сгенерировать круговой турнир
      </Button>
    );
  }

  if (format === "groups_playoff") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={generating !== null}
          onClick={() =>
            run(
              "groups",
              () => generateGroupStage(tournamentId),
              "Групповой этап сгенерирован (нужна жеребьёвка групп заранее)"
            )
          }
        >
          {generating === "groups" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
          Сгенерировать групповой этап
        </Button>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Выходит из группы</Label>
          <Input
            type="number"
            min={1}
            max={8}
            value={advancePerGroup}
            onChange={(e) => setAdvancePerGroup(Number(e.target.value))}
            className="h-9 w-16"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={generating !== null}
          onClick={() =>
            run(
              "playoff",
              () => generatePlayoffFromGroups(tournamentId, advancePerGroup),
              "Плей-офф сгенерирован по итогам групп"
            )
          }
        >
          {generating === "playoff" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
          Сгенерировать плей-офф по группам
        </Button>
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      Автогенерация сетки для double elimination пока не поддерживается — добавляйте матчи вручную.
    </p>
  );
}

export function MatchesManager({
  tournamentId,
  matches,
  teams,
  modes = [],
  format,
  gameConfig,
}: {
  tournamentId: string;
  matches: Match[];
  teams: Team[];
  modes?: string[];
  format: TournamentFormat;
  gameConfig?: GameConfig;
}) {
  const router = useRouter();
  const [showFinished, setShowFinished] = useState(false);

  function MatchCard({ match }: { match: Match }) {
    const statusLabel =
      match.status === "live" ? "Идёт" : match.status === "finished" ? "Завершён" : "Запланирован";
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge
              variant={match.status === "live" ? "destructive" : match.status === "finished" ? "secondary" : "outline"}
            >
              {statusLabel}
            </Badge>
            R{match.round} · до {match.win_target} {winsWord(match.win_target)} · {formatDateTime(match.scheduled_at)}
          </div>
          <div className="text-sm font-medium">
            {match.team_a?.name ?? "TBD"} vs {match.team_b?.name ?? "TBD"}
          </div>
          <div className="flex items-center gap-2">
            <EditPlanDialog match={match} tournamentId={tournamentId} modes={modes} gameConfig={gameConfig} />
            <ConfirmDeleteDialog
              entityName="удалить"
              onConfirm={() => deleteMatch(match.id, tournamentId).then((r) => { router.refresh(); return r; })}
              trigger={
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>
        </div>
        <div className="border-t border-white/10 pt-3">
          {match.modes_plan && match.modes_plan.length > 0 ? (
            <ModeResultsEditor match={match} tournamentId={tournamentId} />
          ) : (
            <ScoreEditor match={match} tournamentId={tournamentId} />
          )}
        </div>
      </div>
    );
  }

  const active = matches.filter((m) => m.status !== "finished");
  const finished = matches.filter((m) => m.status === "finished");
  const activeGroup = active.filter((m) => m.stage === "group");
  const activePlayoff = active.filter((m) => m.stage === "playoff");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Матчи ({matches.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <GenerateControls tournamentId={tournamentId} format={format} />
          <AddMatchDialog tournamentId={tournamentId} teams={teams} modes={modes} gameConfig={gameConfig} />
        </div>
      </div>

      {active.length === 0 && finished.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-muted-foreground">
          Матчи ещё не созданы.
        </div>
      )}

      {(activeGroup.length > 0 || finished.some((m) => m.stage === "group")) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Групповой этап / таблица</h3>
          {(() => {
            const allGroupMatches = matches.filter((m) => m.stage === "group");
            const byGroup = new Map<string, { id: string; name: string }[]>();
            for (const t of teams) {
              if (t.status !== "approved") continue;
              const key = t.group_label ?? "Группа";
              byGroup.set(key, [...(byGroup.get(key) ?? []), { id: t.id, name: t.name }]);
            }
            return (
              <div className="grid gap-4 lg:grid-cols-2">
                {Array.from(byGroup.entries()).map(([label, groupTeams]) => {
                  const groupTeamIds = new Set(groupTeams.map((t) => t.id));
                  const groupMatches = allGroupMatches.filter(
                    (m) => (m.team_a_id && groupTeamIds.has(m.team_a_id)) || (m.team_b_id && groupTeamIds.has(m.team_b_id))
                  );
                  const standings = computeStandings(groupTeams, groupMatches);
                  return (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 text-sm font-semibold text-muted-foreground">{label}</div>
                      <StandingsTable standings={standings} accentColor="#a78bfa" />
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {activeGroup.length > 0 && (
            <div className="space-y-2 pt-2">
              {activeGroup.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}

      {activePlayoff.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Плей-офф ({activePlayoff.length})</h3>
          <div className="space-y-2">
            {activePlayoff.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowFinished((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            {showFinished ? "▾" : "▸"} Завершённые ({finished.length})
          </button>
          {showFinished && (
            <div className="space-y-2">
              {finished.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
