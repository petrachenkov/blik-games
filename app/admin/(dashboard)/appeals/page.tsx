import { AppealsManager } from "@/components/admin/appeals-manager";
import { requireProfile, getAllowedGameIds } from "@/lib/auth";
import { getPendingMatchResults, getPendingAppeals } from "@/lib/data/appeals";

export default async function AdminAppealsPage() {
  const profile = await requireProfile();
  const allowed = await getAllowedGameIds(profile);

  const [results, appeals] = await Promise.all([
    getPendingMatchResults(allowed),
    getPendingAppeals(allowed),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Апелляции и споры</h1>
        <p className="text-sm text-muted-foreground">
          Проверка результатов, поданных капитанами, и рассмотрение апелляций.
        </p>
      </div>
      <AppealsManager results={results as any} appeals={appeals as any} />
    </div>
  );
}
