"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateSetting } from "@/lib/actions/settings";

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [channelUrl, setChannelUrl] = useState(settings.official_channel_url ?? "");
  const [maxChannelUrl, setMaxChannelUrl] = useState(settings.max_channel_url ?? "");
  const [maxChatUrl, setMaxChatUrl] = useState(settings.max_chat_url ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const results = await Promise.all([
      updateSetting("official_channel_url", channelUrl),
      updateSetting("max_channel_url", maxChannelUrl),
      updateSetting("max_chat_url", maxChatUrl),
    ]);
    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed) {
      toast.error(failed.error);
      return;
    }
    toast.success("Настройки сохранены");
  }

  return (
    <Card>
      <CardContent className="max-w-lg space-y-4 p-6">
        <div className="space-y-1.5">
          <Label>Официальный канал (Telegram)</Label>
          <Input value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)} placeholder="https://t.me/..." />
        </div>
        <div className="space-y-1.5">
          <Label>Канал в MAX</Label>
          <Input value={maxChannelUrl} onChange={(e) => setMaxChannelUrl(e.target.value)} placeholder="https://max.ru/join/..." />
        </div>
        <div className="space-y-1.5">
          <Label>Чат в MAX</Label>
          <Input value={maxChatUrl} onChange={(e) => setMaxChatUrl(e.target.value)} placeholder="https://max.ru/join/..." />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}
