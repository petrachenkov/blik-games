"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { GameStatusBadge } from "@/components/site/status-badge";
import { hexToRgba } from "@/lib/utils";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GameCard({ game, className }: { game: Game; className?: string }) {
  const isFrozen = game.status === "frozen";
  const isArchived = game.status === "archived";
  const disabled = isFrozen || isArchived;

  const content = (
    <motion.div
      whileHover={disabled ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl",
        disabled && "grayscale opacity-60",
        className
      )}
      style={
        {
          "--glow-color": hexToRgba(game.accent_color, 0.5),
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at 50% 0%, ${hexToRgba(game.accent_color, 0.15)}, transparent 60%)`,
        }}
      />
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {game.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.cover_url}
            alt={game.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${hexToRgba(game.accent_color, 0.35)}, transparent)` }}
          >
            <Gamepad2 className="h-14 w-14 opacity-40" style={{ color: game.accent_color }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {game.status !== "active" && (
          <div className="absolute right-3 top-3">
            <GameStatusBadge status={game.status} />
          </div>
        )}
        <div
          className="absolute bottom-0 left-0 h-1 w-full"
          style={{ background: game.accent_color }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center gap-2.5">
          {game.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.logo_url} alt="" className="h-7 w-7 shrink-0 rounded-md object-cover" />
          )}
          <h3 className="font-display text-lg font-bold">{game.name}</h3>
        </div>
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{game.description}</p>
        {isFrozen && game.freeze_reason && (
          <p className="mt-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-300">
            {game.freeze_reason}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-sm font-medium" style={{ color: game.accent_color }}>
          {isArchived ? "Смотреть архив" : "Открыть турниры"}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </motion.div>
  );

  if (disabled && isFrozen) {
    return <div className="h-full">{content}</div>;
  }

  return (
    <Link href={`/${game.slug}`} className="block h-full">
      {content}
    </Link>
  );
}
