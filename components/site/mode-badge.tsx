import { Badge } from "@/components/ui/badge";
import { getModeIcon } from "@/lib/mode-icons";

export function ModeBadge({ mode, map }: { mode: string; map?: string }) {
  const icon = getModeIcon(mode);
  return (
    <Badge variant="outline" className="gap-1.5">
      {icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="h-4 w-4 shrink-0 object-contain" />
      )}
      {mode}
      {map ? ` · ${map}` : ""}
    </Badge>
  );
}
