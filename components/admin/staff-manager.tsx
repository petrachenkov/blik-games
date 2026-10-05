"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Loader2, UserPlus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { findUserByEmail, setStaffAssignment, removeStaffRole } from "@/lib/actions/staff";
import { APP_ROLE_LABELS } from "@/lib/types";
import type { AppRole, Game, Profile } from "@/lib/types";

function AssignForm({ games }: { games: Game[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<Profile | null>(null);
  const [role, setRole] = useState<Exclude<AppRole, null>>("game_admin");
  const [gameIds, setGameIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSearch() {
    if (!email.trim()) return;
    setSearching(true);
    setFound(null);
    const result = await findUserByEmail(email);
    setSearching(false);
    if (!("data" in result)) {
      toast.error(result.error);
      return;
    }
    setFound(result.data as Profile);
    setRole((result.data?.role as Exclude<AppRole, null>) || "game_admin");
  }

  function toggleGame(gameId: string) {
    setGameIds((prev) => (prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]));
  }

  async function handleSave() {
    if (!found) return;
    if (gameIds.length === 0) {
      toast.error("Выберите хотя бы одну игру");
      return;
    }
    setSaving(true);
    const result = await setStaffAssignment({ userId: found.id, role, gameIds });
    setSaving(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Роль назначена");
    setFound(null);
    setEmail("");
    setGameIds([]);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h3 className="font-display text-lg font-bold">Назначить сотрудника</h3>
        <p className="text-sm text-muted-foreground">
          Пользователь должен сначала сам зарегистрироваться в{" "}
          <a href="/team/auth" target="_blank" className="text-violet-400 hover:underline">
            кабинете капитана
          </a>{" "}
          (это обычная форма входа — она же используется для выдачи ролей персонала). После этого введите его
          email здесь.
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Найти
          </Button>
        </div>

        {found && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="font-medium">{found.display_name || found.email}</div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Exclude<AppRole, null>)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Суперадмин</SelectItem>
                  <SelectItem value="game_admin">Админ игры</SelectItem>
                  <SelectItem value="judge">Судья</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role !== "superadmin" && (
              <div className="space-y-1.5">
                <Label>Игры</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {games.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={gameIds.includes(g.id)} onCheckedChange={() => toggleGame(g.id)} />
                      {g.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Назначить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StaffManager({ games, staff }: { games: Game[]; staff: any[] }) {
  const router = useRouter();

  async function handleRemove(userId: string) {
    const r = await removeStaffRole(userId);
    router.refresh();
    return "error" in r && r.error ? { error: r.error } : undefined;
  }

  return (
    <div className="space-y-8">
      <AssignForm games={games} />

      <div>
        <h3 className="mb-4 font-display text-lg font-bold">Текущий персонал ({staff.length})</h3>
        <div className="space-y-3">
          {staff.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-muted-foreground">
              Пока назначен только суперадмин.
            </div>
          )}
          {staff.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.display_name || s.email}</span>
                  <Badge variant="secondary">{APP_ROLE_LABELS[s.role as Exclude<AppRole, null>]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{s.email}</div>
                {s.games?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {s.games.map((g: any) => (
                      <span key={g.id} className="text-xs" style={{ color: g.accent_color }}>
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ConfirmDeleteDialog
                entityName={s.display_name || s.email}
                onConfirm={() => handleRemove(s.id)}
                trigger={
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3.5 w-3.5" /> Снять роль
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
