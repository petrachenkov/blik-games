"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { deleteTournament } from "@/lib/actions/tournaments";

export function DeleteTournamentButton({ tournamentId, title }: { tournamentId: string; title: string }) {
  return (
    <ConfirmDeleteDialog
      entityName={title}
      onConfirm={() => deleteTournament(tournamentId)}
      trigger={
        <Button variant="destructive" size="sm">
          <Trash2 className="h-3.5 w-3.5" /> Удалить
        </Button>
      }
    />
  );
}
