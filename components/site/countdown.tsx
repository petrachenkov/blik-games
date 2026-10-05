"use client";

import { useEffect, useState } from "react";

function getTimeParts(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff <= 0,
  };
}

export function Countdown({ target, className }: { target: string; className?: string }) {
  // null до монтирования на клиенте — чтобы серверный и первый клиентский
  // рендер совпадали (Date.now() на сервере и клиенте всегда немного расходится).
  const [parts, setParts] = useState<ReturnType<typeof getTimeParts> | null>(null);

  useEffect(() => {
    setParts(getTimeParts(target));
    const timer = setInterval(() => setParts(getTimeParts(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  const units = [
    { label: "дн", value: parts?.days ?? 0 },
    { label: "ч", value: parts?.hours ?? 0 },
    { label: "мин", value: parts?.minutes ?? 0 },
    { label: "сек", value: parts?.seconds ?? 0 },
  ];

  return (
    <div className={className} suppressHydrationWarning>
      {parts?.done ? (
        "Уже началось!"
      ) : (
        <div className="flex gap-3 sm:gap-4">
          {units.map((unit) => (
            <div key={unit.label} className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-display text-2xl font-bold tabular-nums sm:h-16 sm:w-16 sm:text-3xl">
                {String(unit.value).padStart(2, "0")}
              </div>
              <span className="mt-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
