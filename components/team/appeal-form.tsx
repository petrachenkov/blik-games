"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Flag, Upload, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitAppeal } from "@/lib/actions/appeals";
import { cn } from "@/lib/utils";

export function AppealForm({ matchId, teamId }: { matchId: string; teamId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function uploadMany(files: FileList) {
    const total = files.length;
    setProgress({ done: 0, total });
    try {
      let done = 0;
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "evidence");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setEvidenceUrls((prev) => [...prev, json.url]);
        done += 1;
        setProgress({ done, total });
      }
      toast.success("Файлы загружены");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setProgress(null);
    }
  }

  async function handleSubmit() {
    if (!reason.trim()) {
      toast.error("Опишите причину апелляции");
      return;
    }
    setSubmitting(true);
    const result = await submitAppeal({
      matchId,
      teamId,
      reason,
      evidenceUrls: evidenceUrls.length ? evidenceUrls : undefined,
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Апелляция отправлена");
    setOpen(false);
    setReason("");
    setEvidenceUrls([]);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Flag className="h-3.5 w-3.5" /> Подать апелляцию
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <Textarea
        placeholder="Опишите, почему вы не согласны с результатом"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
      />

      <div className="space-y-2">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10",
            progress && "pointer-events-none opacity-60"
          )}
        >
          {progress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {progress ? `Загружено ${progress.done} из ${progress.total}` : "Прикрепить фото/видео (необязательно)"}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && e.target.files.length > 0 && uploadMany(e.target.files)}
          />
        </label>

        {evidenceUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {evidenceUrls.map((url, i) => (
              <span key={url} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                <Paperclip className="h-3 w-3" /> Файл {i + 1}
                <button type="button" onClick={() => setEvidenceUrls((prev) => prev.filter((u) => u !== url))}>
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Отправить
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
