"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTournament, updateTournament } from "@/lib/actions/tournaments";
import { slugify } from "@/lib/utils";
import { TOURNAMENT_FORMAT_LABELS } from "@/lib/types";
import type { Tournament, TournamentFormat } from "@/lib/types";

function toInputDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TournamentFormDialog({
  gameId,
  tournament,
  trigger,
}: {
  gameId?: string;
  tournament?: Tournament;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(tournament?.title ?? "");
  const [slug, setSlug] = useState(tournament?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!tournament);
  const [description, setDescription] = useState(tournament?.description ?? "");
  const [format, setFormat] = useState<TournamentFormat>(tournament?.format ?? "single_elimination");
  const [maxTeams, setMaxTeams] = useState(tournament?.max_teams ?? 16);
  const [regOpens, setRegOpens] = useState(toInputDate(tournament?.registration_opens_at ?? null));
  const [regCloses, setRegCloses] = useState(toInputDate(tournament?.registration_closes_at ?? null));
  const [startsAt, setStartsAt] = useState(toInputDate(tournament?.starts_at ?? null));
  const [prizeInfo, setPrizeInfo] = useState(tournament?.prize_info ?? "");
  const [rulesMd, setRulesMd] = useState(tournament?.rules_md ?? "");

  async function handleSave() {
    setSaving(true);
    const payload = {
      title,
      slug,
      description,
      format,
      max_teams: maxTeams,
      registration_opens_at: regOpens,
      registration_closes_at: regCloses,
      starts_at: startsAt,
      prize_info: prizeInfo,
      rules_md: rulesMd,
    };
    const result = tournament
      ? await updateTournament(tournament.id, payload)
      : await createTournament(gameId!, payload);
    setSaving(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(tournament ? "Турнир обновлён" : "Турнир создан");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tournament ? "Редактировать турнир" : "Создать турнир"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Формат</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as TournamentFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOURNAMENT_FORMAT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Лимит команд</Label>
              <Input type="number" min={2} value={maxTeams} onChange={(e) => setMaxTeams(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Открытие регистрации</Label>
              <Input type="datetime-local" value={regOpens} onChange={(e) => setRegOpens(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Закрытие регистрации</Label>
              <Input type="datetime-local" value={regCloses} onChange={(e) => setRegCloses(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Старт турнира</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Призы (по одной строке на место)</Label>
            <Textarea value={prizeInfo} onChange={(e) => setPrizeInfo(e.target.value)} rows={3} placeholder={"1 место — ...\n2 место — ...\n3 место — ..."} />
          </div>
          <div className="space-y-1.5">
            <Label>Правила (Markdown)</Label>
            <Textarea value={rulesMd} onChange={(e) => setRulesMd(e.target.value)} rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving || !title || !slug}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
