import { Skeleton } from "@/components/ui/skeleton";

export default function GameLoading() {
  return (
    <div className="container space-y-8 py-16">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-5 w-full max-w-xl" />
      <Skeleton className="h-11 w-72 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
