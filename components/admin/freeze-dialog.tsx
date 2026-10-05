"use client";

import { useState } from "react";
import { Loader2, Snowflake } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { freezeGame } from "@/lib/actions/games";

export function FreezeDialog({
  gameId,
  trigger,
  onDone,
}: {
  gameId: string;
  trigger: React.ReactNode;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFreeze() {
    if (!reason.trim()) {
      toast.error("Укажите причину заморозки");
      return;
    }
    setSaving(true);
    const result = await freezeGame(gameId, reason);
    setSaving(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Игра заморожена");
    setOpen(false);
    onDone?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-blue-400" /> Заморозить игру
          </DialogTitle>
          <DialogDescription>
            Регистрация и изменения будут заблокированы. Укажите причину — она будет видна публично.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Например: турнир приостановлен до уточнения даты"
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleFreeze} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Заморозить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
