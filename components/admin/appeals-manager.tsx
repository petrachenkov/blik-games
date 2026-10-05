"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Image as ImageIcon, Video, Loader2, Gavel, Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reviewMatchResult } from "@/lib/actions/results";
import { resolveAppeal } from "@/lib/actions/appeals";
import { APPEAL_RESOLUTION_LABELS } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import type { MatchResult, Appeal, AppealResolution } from "@/lib/types";

function MatchLabel({ match }: { match: any }) {
  const game = match?.tournaments?.games;
  return (
    <div className="text-xs text-muted-foreground">
      {game && <span style={{ color: game.accent_color }}>{game.name}</span>}
      {game && " · "}
      {match?.tournaments?.title}
      {" · "}
      {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}
    </div>
  );
}

function ResultCard({ result }: { result: MatchResult & { match?: any } }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<"confirmed" | "disputed" | null>(null);

  async function handleReview(decision: "confirmed" | "disputed") {
    setSaving(decision);
    const res = await reviewMatchResult({
      resultId: result.id,
      matchId: result.match_id,
      decision,
      notes,
    });
    setSaving(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(decision === "confirmed" ? "Результат подтверждён" : "Результат помечен как спорный");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <MatchLabel match={result.match} />
        <div className="flex items-center justify-between">
          <span className="font-medium">Заявлено: {result.submitted_by_team?.name}</span>
          <span className="font-display text-lg font-bold tabular-nums">
            {result.score_a} : {result.score_b}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {result.screenshot_urls.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-violet-400 hover:underline"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Скриншот {result.screenshot_urls.length > 1 ? i + 1 : ""}
            </a>
          ))}
          {result.recording_urls?.map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-violet-400 hover:underline"
            >
              <Video className="h-3.5 w-3.5" /> Запись {result.recording_urls!.length > 1 ? i + 1 : ""}
            </a>
          ))}
          <span className="text-muted-foreground">{formatDateTime(result.created_at)}</span>
        </div>
        <Textarea
          placeholder="Комментарий (необязательно)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleReview("confirmed")} disabled={saving !== null}>
            {saving === "confirmed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Подтвердить
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReview("disputed")}
            disabled={saving !== null}
          >
            {saving === "disputed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Оспорить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResolveAppealDialog({ appeal }: { appeal: Appeal & { match?: any } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState<AppealResolution>("kept");
  const [notes, setNotes] = useState("");
  const [scoreA, setScoreA] = useState(appeal.match?.score_a ?? 0);
  const [scoreB, setScoreB] = useState(appeal.match?.score_b ?? 0);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await resolveAppeal({
      appealId: appeal.id,
      matchId: appeal.match_id,
      resolution,
      notes,
      newScoreA: resolution === "changed" ? scoreA : undefined,
      newScoreB: resolution === "changed" ? scoreB : undefined,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Апелляция рассмотрена");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button size="sm">
          <Gavel className="h-3.5 w-3.5" /> Вынести решение
        </Button>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Решение по апелляции</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={resolution} onValueChange={(v) => setResolution(v as AppealResolution)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(APPEAL_RESOLUTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {resolution === "changed" && (
            <div className="flex items-center gap-2">
              <Input type="number" value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))} className="w-20" />
              <span className="text-muted-foreground">:</span>
              <Input type="number" value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))} className="w-20" />
            </div>
          )}
          <Textarea
            placeholder="Комментарий к решению"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить решение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppealCard({ appeal }: { appeal: Appeal & { match?: any } }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <MatchLabel match={appeal.match} />
        <div className="flex items-center justify-between">
          <span className="font-medium">Подала: {appeal.submitted_by_team?.name}</span>
          <Badge variant="outline">{formatDateTime(appeal.created_at)}</Badge>
        </div>
        <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
          {appeal.reason}
        </p>
        {appeal.evidence_urls && appeal.evidence_urls.length > 0 && (
          <div className="flex flex-wrap gap-3 text-sm">
            {appeal.evidence_urls.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-violet-400 hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" /> Файл {i + 1}
              </a>
            ))}
          </div>
        )}
        <ResolveAppealDialog appeal={appeal} />
      </CardContent>
    </Card>
  );
}

export function AppealsManager({
  results,
  appeals,
}: {
  results: (MatchResult & { match?: any })[];
  appeals: (Appeal & { match?: any })[];
}) {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-4 font-display text-lg font-bold">
          Результаты на проверке ({results.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-muted-foreground">
              Нет результатов, ожидающих проверки.
            </div>
          )}
          {results.map((r) => (
            <ResultCard key={r.id} result={r} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-bold">Апелляции ({appeals.length})</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appeals.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-muted-foreground">
              Нет апелляций на рассмотрении.
            </div>
          )}
          {appeals.map((a) => (
            <AppealCard key={a.id} appeal={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
