"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { ColorPicker } from "@/components/ui/color-picker";
import { GameCard } from "@/components/site/game-card";
import { createGame, updateGame } from "@/lib/actions/games";
import { slugify } from "@/lib/utils";
import type { Game, GameConfig, PlayerFieldConfig } from "@/lib/types";

const emptyConfig: GameConfig = {
  team_size: 5,
  substitutes: 1,
  player_fields: [],
  modes: [],
  maps: [],
  match_format: "bo3",
};

export function GameFormDialog({
  game,
  trigger,
  onSaved,
}: {
  game?: Game;
  trigger: React.ReactNode;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(game?.name ?? "");
  const [slug, setSlug] = useState(game?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!game);
  const [shortName, setShortName] = useState(game?.short_name ?? "");
  const [description, setDescription] = useState(game?.description ?? "");
  const [accentColor, setAccentColor] = useState(game?.accent_color ?? "#7C3AED");
  const [logoUrl, setLogoUrl] = useState(game?.logo_url ?? "");
  const [coverUrl, setCoverUrl] = useState(game?.cover_url ?? "");
  const [config, setConfig] = useState<GameConfig>(game?.game_config ?? emptyConfig);

  function updateField<K extends keyof PlayerFieldConfig>(index: number, key: K, value: PlayerFieldConfig[K]) {
    setConfig((c) => ({
      ...c,
      player_fields: c.player_fields.map((f, i) => (i === index ? { ...f, [key]: value } : f)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      name,
      slug,
      short_name: shortName,
      description,
      accent_color: accentColor,
      logo_url: logoUrl,
      cover_url: coverUrl,
      game_config: config,
    };
    const result = game ? await updateGame(game.id, payload) : await createGame(payload);
    setSaving(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(game ? "Игра обновлена" : "Игра создана");
    setOpen(false);
    onSaved?.();
  }

  const previewGame: Game = {
    id: game?.id ?? "preview",
    slug: slug || "preview",
    name: name || "Название игры",
    short_name: shortName || null,
    description: description || "Описание игры появится здесь.",
    logo_url: logoUrl || null,
    cover_url: coverUrl || null,
    accent_color: accentColor,
    status: game?.status ?? "active",
    freeze_reason: game?.freeze_reason ?? null,
    sort_order: game?.sort_order ?? 0,
    game_config: config,
    created_at: game?.created_at ?? new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{game ? "Редактировать игру" : "Добавить игру"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Название</Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Короткое название</Label>
              <Input value={shortName} onChange={(e) => setShortName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Логотип (URL)</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Обложка (URL)</Label>
                <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Акцентный цвет</Label>
              <ColorPicker value={accentColor} onChange={setAccentColor} />
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Размер команды</Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.team_size}
                    onChange={(e) => setConfig((c) => ({ ...c, team_size: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Запасные</Label>
                  <Input
                    type="number"
                    min={0}
                    value={config.substitutes}
                    onChange={(e) => setConfig((c) => ({ ...c, substitutes: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Формат матча</Label>
                  <Input
                    value={config.match_format}
                    onChange={(e) => setConfig((c) => ({ ...c, match_format: e.target.value }))}
                    placeholder="bo3"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Режимы игры (через запятую)</Label>
                <Input
                  value={config.modes.join(", ")}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, modes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Карты (через запятую, необязательно)</Label>
                <Input
                  value={config.maps.join(", ")}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, maps: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Дополнительные поля игрока</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        player_fields: [...c.player_fields, { key: "", label: "", pattern: "", required: true }],
                      }))
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Поле
                  </Button>
                </div>
                {config.player_fields.map((field, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input
                      placeholder="key"
                      value={field.key}
                      onChange={(e) => updateField(i, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Название поля"
                      value={field.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                    />
                    <Input
                      placeholder="RegEx (необязательно)"
                      value={field.pattern ?? ""}
                      onChange={(e) => updateField(i, "pattern", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((c) => ({ ...c, player_fields: c.player_fields.filter((_, idx) => idx !== i) }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
              Предпросмотр
            </Label>
            <div className="max-w-xs pointer-events-none">
              <GameCard game={previewGame} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving || !name || !slug}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
