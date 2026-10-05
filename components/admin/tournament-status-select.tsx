"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setTournamentStatus } from "@/lib/actions/tournaments";
import { TOURNAMENT_STATUS_LABELS } from "@/lib/types";
import type { TournamentStatus } from "@/lib/types";

export function TournamentStatusSelect({ tournamentId, status }: { tournamentId: string; status: TournamentStatus }) {
  const router = useRouter();

  async function handleChange(value: string) {
    const result = await setTournamentStatus(tournamentId, value as TournamentStatus);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Статус обновлён");
    router.refresh();
  }

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(TOURNAMENT_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
