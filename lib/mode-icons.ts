// Иконки режимов Brawl Stars. Пути уже включают basePath ("/games"),
// так как next.config.mjs не прокидывает его автоматически в <img src>.
const MODE_ICONS: Record<string, string> = {
  "Нокаут": "/games/modes/knockout.png",
  "Броубол": "/games/modes/brawl-ball.png",
  "Награда за поимку": "/games/modes/bounty.png",
  "Захват кристаллов": "/games/modes/gem-grab.png",
  "Ограбление": "/games/modes/heist.png",
  "Горячая зона": "/games/modes/hot-zone.png",
};

export function getModeIcon(mode: string): string | null {
  return MODE_ICONS[mode] ?? null;
}
