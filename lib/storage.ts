import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const FOLDER_RULES: Record<string, { maxSize: number; allowedTypes: string[] }> = {
  teams: { maxSize: 5 * 1024 * 1024, allowedTypes: IMAGE_TYPES },
  games: { maxSize: 5 * 1024 * 1024, allowedTypes: IMAGE_TYPES },
  evidence: { maxSize: 200 * 1024 * 1024, allowedTypes: [...IMAGE_TYPES, ...VIDEO_TYPES] },
};

export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.resolve(process.cwd(), "uploads");
}

export async function saveUpload(file: File, folder: string): Promise<{ url: string } | { error: string }> {
  const rule = FOLDER_RULES[folder] ?? FOLDER_RULES.teams;

  if (!rule.allowedTypes.includes(file.type)) {
    return { error: "Недопустимый формат файла" };
  }
  if (file.size > rule.maxSize) {
    return { error: `Файл слишком большой (макс. ${Math.round(rule.maxSize / 1024 / 1024)} МБ)` };
  }

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "") || "misc";
  const extMatch = /\.([a-z0-9]{1,10})$/i.exec(file.name);
  const ext = extMatch ? extMatch[1].toLowerCase() : "bin";
  const fileName = `${randomUUID()}.${ext}`;

  const dir = path.join(getUploadsDir(), safeFolder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), buffer);

  return { url: `/games/uploads/${safeFolder}/${fileName}` };
}
