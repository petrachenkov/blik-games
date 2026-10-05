"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Upload, Loader2, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { registerTeam } from "@/lib/actions/registration";
import { teamRegistrationSchema } from "@/lib/validations";
import type { GameConfig } from "@/lib/types";
import { cn, telegramUrl } from "@/lib/utils";

interface SubmittedPlayer {
  full_name: string;
  study_group: string;
  telegram: string;
  is_substitute: boolean;
  game_data: Record<string, string>;
}

interface SubmittedTeam {
  name: string;
  logo_url: string;
  captain_telegram: string;
  players: SubmittedPlayer[];
}

export function RegistrationForm({
  tournamentId,
  gameConfig,
  accentColor,
}: {
  tournamentId: string;
  gameConfig: GameConfig;
  accentColor: string;
}) {
  const [submittedTeam, setSubmittedTeam] = useState<SubmittedTeam | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  const schema = teamRegistrationSchema(gameConfig.player_fields, gameConfig.team_size, gameConfig.substitutes);

  const emptyPlayer = {
    full_name: "",
    study_group: "",
    telegram: "",
    is_substitute: false,
    game_data: Object.fromEntries(gameConfig.player_fields.map((f) => [f.key, ""])),
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      logo_url: "",
      captain_telegram: "",
      players: Array.from({ length: gameConfig.team_size }, () => ({ ...emptyPlayer })),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "players" });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "teams");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLogoUrl(json.url);
      setValue("logo_url", json.url);
      toast.success("Логотип загружен");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: any) {
    const result = await registerTeam(tournamentId, gameConfig, values);
    if ("error" in result && result.error) {
      toast.error("Не удалось создать заявку: " + result.error);
      return;
    }

    setSubmittedTeam({
      name: values.name,
      logo_url: values.logo_url || "",
      captain_telegram: values.captain_telegram,
      players: values.players,
    });
    toast.success("Заявка отправлена на рассмотрение!");
  }

  if (submittedTeam) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="h-10 w-10" style={{ color: accentColor }} />
            <h3 className="font-display text-xl font-bold">Заявка отправлена!</h3>
            <p className="max-w-md text-muted-foreground">
              Организаторы проверят заявку и подтвердят участие — статус будет виден на вкладке «Команды».
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {submittedTeam.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={submittedTeam.logo_url} alt={submittedTeam.name} className="h-10 w-10 rounded-lg object-cover" />
                )}
                <h4 className="font-display text-lg font-bold">{submittedTeam.name}</h4>
              </div>
              <Badge variant="outline">На рассмотрении</Badge>
            </div>
            <a
              href={telegramUrl(submittedTeam.captain_telegram)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Send className="h-3.5 w-3.5" /> Капитан: @{submittedTeam.captain_telegram.replace(/^@/, "")}
            </a>
            <div className="space-y-1.5 border-t border-white/10 pt-3">
              {submittedTeam.players.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className={p.is_substitute ? "text-muted-foreground" : ""}>
                    {p.full_name} {p.is_substitute && "(запасной)"} · {p.study_group}
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-display text-lg font-bold">Данные команды</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Название команды</Label>
              <Input id="name" {...register("name")} placeholder="Например, Phoenix" />
              {errors.name && <p className="text-xs text-destructive">{String(errors.name.message)}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="captain_telegram">Telegram капитана</Label>
              <Input id="captain_telegram" {...register("captain_telegram")} placeholder="@username" />
              {errors.captain_telegram && (
                <p className="text-xs text-destructive">{String(errors.captain_telegram.message)}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Логотип команды (необязательно)</Label>
            <div className="flex items-center gap-3">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Логотип" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Загрузить логотип
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">
            Игроки ({fields.length}/{gameConfig.team_size + gameConfig.substitutes})
          </h3>
          {fields.length < gameConfig.team_size + gameConfig.substitutes && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyPlayer, is_substitute: true })}
            >
              <Plus className="h-4 w-4" /> Добавить запасного
            </Button>
          )}
        </div>

        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Игрок {index + 1} {index >= gameConfig.team_size && "(запасной)"}
                </span>
                {index >= gameConfig.team_size && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>ФИО</Label>
                  <Input {...register(`players.${index}.full_name` as const)} />
                  {errors.players?.[index]?.full_name && (
                    <p className="text-xs text-destructive">
                      {String(errors.players[index]?.full_name?.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Учебная группа</Label>
                  <Input {...register(`players.${index}.study_group` as const)} />
                  {errors.players?.[index]?.study_group && (
                    <p className="text-xs text-destructive">
                      {String(errors.players[index]?.study_group?.message)}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Telegram</Label>
                  <Input {...register(`players.${index}.telegram` as const)} placeholder="@username" />
                  {errors.players?.[index]?.telegram && (
                    <p className="text-xs text-destructive">
                      {String(errors.players[index]?.telegram?.message)}
                    </p>
                  )}
                </div>
                {gameConfig.player_fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    <Input {...register(`players.${index}.game_data.${field.key}` as const)} />
                    {(errors.players?.[index] as any)?.game_data?.[field.key] && (
                      <p className="text-xs text-destructive">
                        {String((errors.players?.[index] as any)?.game_data?.[field.key]?.message)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {index >= gameConfig.team_size && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`sub-${index}`}
                    checked
                    disabled
                  />
                  <Label htmlFor={`sub-${index}`} className="text-sm text-muted-foreground">
                    Запасной игрок
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {errors.players && typeof errors.players.message === "string" && (
          <p className="text-sm text-destructive">{errors.players.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        style={{ backgroundColor: accentColor }}
        className="w-full sm:w-auto"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Отправить заявку
      </Button>
    </form>
  );
}
