import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireProfile } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";

export default async function AdminSettingsPage() {
  const profile = await requireProfile();
  if (profile.role !== "superadmin") redirect("/admin");

  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Настройки</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
