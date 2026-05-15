import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    const pipeline = sharp(buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });
    const { data: resized, info } = await pipeline.toBuffer({ resolveWithObject: true });

    const image = await db.image.create({
      data: {
        mimeType: file.type,
        bytes: new Uint8Array(resized),
        width: info.width,
        height: info.height,
        byteSize: resized.byteLength,
      },
      select: { id: true },
    });

    const url = `/api/images/${image.id}`;
    logger.info({ id: image.id, bytes: resized.byteLength }, "upload.image");
    return NextResponse.json({ url });
  } catch (e) {
    logger.error({ err: (e as Error).message }, "upload.failed");
    return NextResponse.json({ error: "Грешка при качване" }, { status: 500 });
  }
}
