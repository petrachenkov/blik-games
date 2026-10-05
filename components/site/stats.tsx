"use client";

import { motion } from "framer-motion";
import { Gamepad2, Trophy, Users, UserRound } from "lucide-react";

export function StatsSection({
  stats,
}: {
  stats: { games: number; tournaments: number; teams: number; players: number };
}) {
  const items = [
    { label: "Игр", value: stats.games, icon: Gamepad2 },
    { label: "Турниров", value: stats.tournaments, icon: Trophy },
    { label: "Команд", value: stats.teams, icon: Users },
    { label: "Игроков", value: stats.players, icon: UserRound },
  ];

  return (
    <section className="container py-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center backdrop-blur-xl"
          >
            <item.icon className="h-5 w-5 text-violet-400" />
            <div className="font-display text-3xl font-extrabold tabular-nums">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
