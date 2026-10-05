import { Badge } from "@/components/ui/badge";
import { TEAM_STATUS_LABELS } from "@/lib/types";
import type { TeamStatus } from "@/lib/types";

const variants: Record<TeamStatus, "success" | "outline" | "destructive"> = {
  approved: "success",
  pending: "outline",
  rejected: "destructive",
  disqualified: "destructive",
};

export function TeamStatusBadge({ status }: { status: TeamStatus }) {
  return <Badge variant={variants[status]}>{TEAM_STATUS_LABELS[status]}</Badge>;
}
