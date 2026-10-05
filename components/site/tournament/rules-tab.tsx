import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function RulesTab({ rulesMd }: { rulesMd: string }) {
  if (!rulesMd.trim()) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-muted-foreground">
        Правила турнира скоро появятся.
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-a:text-violet-400">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{rulesMd}</ReactMarkdown>
    </div>
  );
}
