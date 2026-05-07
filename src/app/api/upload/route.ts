import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/session";
import { logger } from "@/lib/logger";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Липсва файл" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Поддържат се само JPEG, PNG и WebP" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файлът е по-голям от 5 MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .toBuffer();

    const ext = EXT[file.type];
    const id = randomUUID();
    const dir = path.join(process.cwd(), "public", "uploads", "articles");
    await mkdir(dir, { recursive: true });
    const filename = `${id}.${ext}`;
    await writeFile(path.join(dir, filename), resized);

    const url = `/uploads/articles/${filename}`;
    logger.info({ filename, bytes: resized.byteLength }, "upload.image");
    return NextResponse.json({ url });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "upload.failed");
    return NextResponse.json({ error: "Грешка при качване" }, { status: 500 });
  }
}
