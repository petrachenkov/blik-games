"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, Send, X, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitMatchResult } from "@/lib/actions/results";
import { cn } from "@/lib/utils";

export function MatchResultForm({ matchId, teamId }: { matchId: string; teamId: string }) {
  const router = useRouter();
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [recordingUrls, setRecordingUrls] = useState<string[]>([]);
  const [shotProgress, setShotProgress] = useState<{ done: number; total: number } | null>(null);
  const [recProgress, setRecProgress] = useState<{ done: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function uploadMany(files: FileList, kind: "screenshot" | "recording") {
    const setProgress = kind === "screenshot" ? setShotProgress : setRecProgress;
    const setUrls = kind === "screenshot" ? setScreenshotUrls : setRecordingUrls;
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
        setUrls((prev) => [...prev, json.url]);
        done += 1;
        setProgress({ done, total });
      }
      toast.success(kind === "screenshot" ? "Скриншоты загружены" : "Записи загружены");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setProgress(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (screenshotUrls.length === 0) {
      toast.error("Загрузите хотя бы один скриншот результата");
      return;
    }
    setSubmitting(true);
    const result = await submitMatchResult({
      matchId,
      teamId,
      scoreA,
      scoreB,
      screenshotUrls,
      recordingUrls: recordingUrls.length ? recordingUrls : undefined,
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Результат отправлен на проверку");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <Label>Счёт</Label>
        <Input type="number" min={0} value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))} className="h-8 w-16" />
        <span className="text-muted-foreground">:</span>
        <Input type="number" min={0} value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))} className="h-8 w-16" />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          <label
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10",
              shotProgress && "pointer-events-none opacity-60"
            )}
          >
            {shotProgress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {shotProgress ? `Загружено ${shotProgress.done} из ${shotProgress.total}` : "Загрузить скриншоты (обязательно)"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && e.target.files.length > 0 && uploadMany(e.target.files, "screenshot")}
            />
          </label>
          <label
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10",
              recProgress && "pointer-events-none opacity-60"
            )}
          >
            {recProgress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {recProgress ? `Загружено ${recProgress.done} из ${recProgress.total}` : "Загрузить записи (необязательно)"}
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && e.target.files.length > 0 && uploadMany(e.target.files, "recording")}
            />
          </label>
        </div>

        {(screenshotUrls.length > 0 || recordingUrls.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {screenshotUrls.map((url, i) => (
              <span key={url} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                <ImageIcon className="h-3 w-3" /> Скриншот {i + 1}
                <button type="button" onClick={() => setScreenshotUrls((prev) => prev.filter((u) => u !== url))}>
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ))}
            {recordingUrls.map((url, i) => (
              <span key={url} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                <Video className="h-3 w-3" /> Запись {i + 1}
                <button type="button" onClick={() => setRecordingUrls((prev) => prev.filter((u) => u !== url))}>
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" size="sm" disabled={submitting || screenshotUrls.length === 0}>
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Отправить результат
      </Button>
    </form>
  );
}
