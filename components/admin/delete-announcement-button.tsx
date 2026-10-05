"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteAnnouncement } from "@/lib/actions/announcements";

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const result = await deleteAnnouncement(id);
    if ("error" in result && result.error) toast.error(result.error);
    else {
      toast.success("Удалено");
      router.refresh();
    }
  }

  return (
    <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
