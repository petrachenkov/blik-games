import Link from "next/link";
import { Trophy, Send, MessageCircle } from "lucide-react";

export function SiteFooter({
  channelUrl,
  chatUrl,
}: {
  channelUrl?: string;
  chatUrl?: string;
}) {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-display text-sm font-bold">Blik Games</div>
            <div className="text-xs text-muted-foreground">Киберспортивный хаб колледжа</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {channelUrl && (
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
            >
              <Send className="h-4 w-4" /> Официальный канал
            </a>
          )}
          {chatUrl && (
            <a
              href={chatUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" /> Чат в MAX
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Blik Games. Все права защищены.
      </div>
    </footer>
  );
}
