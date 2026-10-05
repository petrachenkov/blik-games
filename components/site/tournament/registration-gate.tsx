"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrationForm } from "@/components/site/tournament/registration-form";
import type { GameConfig } from "@/lib/types";

export function RegistrationGate({
  tournamentId,
  gameConfig,
  accentColor,
  userId,
}: {
  tournamentId: string;
  gameConfig: GameConfig;
  accentColor: string;
  userId: string | null;
}) {
  const pathname = usePathname();

  if (!userId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <LogIn className="h-10 w-10" style={{ color: accentColor }} />
          <h3 className="font-display text-lg font-bold">Нужен аккаунт капитана</h3>
          <p className="max-w-md text-muted-foreground">
            Чтобы зарегистрировать команду, войдите или создайте аккаунт капитана — это займёт минуту.
          </p>
          <Link href={`/team/auth?redirect=${encodeURIComponent(pathname)}`}>
            <Button style={{ backgroundColor: accentColor }}>Войти как капитан</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <RegistrationForm tournamentId={tournamentId} gameConfig={gameConfig} accentColor={accentColor} />;
}
