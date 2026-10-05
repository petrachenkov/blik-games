import type { GameConfig, ModesPlanEntry } from "@/lib/types";

function pickRandom<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Случайно подбирает 2 основных + 1 решающий режим с картами из пула игры */
export function buildRandomModesPlan(gameConfig: GameConfig | null | undefined): ModesPlanEntry[] {
  if (!gameConfig || !gameConfig.modes || gameConfig.modes.length === 0) return [];
  const count = Math.min(3, gameConfig.modes.length);
  const shuffledModes = [...gameConfig.modes].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffledModes.map((mode) => {
    const maps = gameConfig.mode_maps?.[mode] ?? [];
    return { mode, map: pickRandom(maps) ?? "" };
  });
}
