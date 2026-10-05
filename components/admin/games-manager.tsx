"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Snowflake,
  Flame,
  EyeOff,
  Eye,
  Archive,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameFormDialog } from "@/components/admin/game-form-dialog";
import { FreezeDialog } from "@/components/admin/freeze-dialog";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { GAME_STATUS_LABELS } from "@/lib/types";
import { unfreezeGame, setGameStatus, deleteGame, reorderGames } from "@/lib/actions/games";
import type { Game } from "@/lib/types";

const statusVariant: Record<string, "success" | "secondary" | "outline" | "default"> = {
  active: "success",
  frozen: "secondary",
  hidden: "outline",
  archived: "outline",
};

function SortableRow({ game, canManage }: { game: Game; canManage: boolean }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: game.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleAction(action: () => Promise<{ error?: string; success?: boolean } | void>) {
    const result = await action();
    if (result && "error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {game.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
        ) : (
          <div
            className="h-9 w-9 shrink-0 rounded-lg"
            style={{ backgroundColor: game.accent_color }}
          />
        )}
        <div>
          <div className="flex items-center gap-2 font-medium">
            {game.name}
            <Badge variant={statusVariant[game.status]}>{GAME_STATUS_LABELS[game.status]}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">/{game.slug}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <GameFormDialog
          game={game}
          onSaved={() => router.refresh()}
          trigger={
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Редактировать
            </Button>
          }
        />
        {game.status === "frozen" ? (
          <Button variant="outline" size="sm" onClick={() => handleAction(() => unfreezeGame(game.id))}>
            <Flame className="h-3.5 w-3.5" /> Разморозить
          </Button>
        ) : (
          <FreezeDialog
            gameId={game.id}
            onDone={() => router.refresh()}
            trigger={
              <Button variant="outline" size="sm">
                <Snowflake className="h-3.5 w-3.5" /> Заморозить
              </Button>
            }
          />
        )}
        {game.status === "hidden" ? (
          <Button variant="outline" size="sm" onClick={() => handleAction(() => setGameStatus(game.id, "active"))}>
            <Eye className="h-3.5 w-3.5" /> Показать
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => handleAction(() => setGameStatus(game.id, "hidden"))}>
            <EyeOff className="h-3.5 w-3.5" /> Скрыть
          </Button>
        )}
        {game.status !== "archived" && (
          <Button variant="outline" size="sm" onClick={() => handleAction(() => setGameStatus(game.id, "archived"))}>
            <Archive className="h-3.5 w-3.5" /> В архив
          </Button>
        )}
        {canManage && (
          <ConfirmDeleteDialog
            entityName={game.name}
            onConfirm={() => deleteGame(game.id)}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="h-3.5 w-3.5" /> Удалить
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

export function GamesManager({ games, canManage }: { games: Game[]; canManage: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(games);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((g) => g.id === active.id);
    const newIndex = items.findIndex((g) => g.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    const result = await reorderGames(newItems.map((g) => g.id));
    if ("error" in result && result.error) {
      toast.error(result.error);
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Игры</h1>
        {canManage && (
          <GameFormDialog
            onSaved={() => router.refresh()}
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> Добавить игру
              </Button>
            }
          />
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((game) => (
              <SortableRow key={game.id} game={game} canManage={canManage} />
            ))}
            {items.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
                Игр пока нет.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
