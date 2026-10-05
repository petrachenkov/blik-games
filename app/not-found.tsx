import Link from "next/link";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Ghost className="h-12 w-12 text-muted-foreground" />
      <h1 className="font-display text-2xl font-bold">Страница не найдена</h1>
      <p className="max-w-sm text-muted-foreground">
        Похоже, такой страницы не существует, либо она была скрыта или удалена.
      </p>
      <Link href="/">
        <Button>На главную</Button>
      </Link>
    </div>
  );
}
