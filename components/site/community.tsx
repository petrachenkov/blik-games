import { Send, MessageCircle } from "lucide-react";

export function CommunitySection({
  channelUrl,
  chatUrl,
}: {
  channelUrl?: string;
  chatUrl?: string;
}) {
  if (!channelUrl && !chatUrl) return null;

  return (
    <section className="container py-16">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-fuchsia-500/10 p-8 text-center backdrop-blur-xl sm:p-12">
        <h2 className="mb-3 font-display text-2xl font-bold sm:text-3xl">Присоединяйся к сообществу</h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          Новости турниров, анонсы и общение с другими участниками — в официальном канале и чате.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {channelUrl && (
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
            >
              <Send className="h-4 w-4" /> Официальный канал
            </a>
          )}
          {chatUrl && (
            <a
              href={chatUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
            >
              <MessageCircle className="h-4 w-4" /> Чат в MAX
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
