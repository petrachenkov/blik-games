import { redirect } from "next/navigation";
import { StaffManager } from "@/components/admin/staff-manager";
import { requireProfile } from "@/lib/auth";
import { getAllGamesAdmin } from "@/lib/data/games";
import { getStaffList } from "@/lib/data/staff";

export default async function AdminStaffPage() {
  const profile = await requireProfile();
  if (profile.role !== "superadmin") redirect("/admin");

  const [games, staff] = await Promise.all([getAllGamesAdmin(), getStaffList()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Персонал</h1>
        <p className="text-sm text-muted-foreground">
          Назначение админов игр и судей.
        </p>
      </div>
      <StaffManager games={games} staff={staff} />
    </div>
  );
}
