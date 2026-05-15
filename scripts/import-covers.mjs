import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const PUBLIC_DIR = path.join(process.cwd(), "public");

async function main() {
  const articles = await db.article.findMany({
    where: { coverImage: { startsWith: "/" } },
    select: { id: true, slug: true, coverImage: true },
  });

  let imported = 0;
  let skipped = 0;
  const deletePaths = [];

  for (const article of articles) {
    const ref = article.coverImage;
    if (!ref || !/^\/\d+\.(png|jpe?g|webp)$/i.test(ref)) {
      skipped += 1;
      continue;
    }

    const filePath = path.join(PUBLIC_DIR, ref.slice(1));
    let raw;
    try {
      raw = await readFile(filePath);
    } catch {
      console.warn(`missing file for ${article.slug}: ${filePath}`);
      skipped += 1;
      continue;
    }

    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    const { data: resized, info } = await sharp(raw)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    const image = await db.image.create({
      data: {
        mimeType,
        bytes: new Uint8Array(resized),
        width: info.width,
        height: info.height,
        byteSize: resized.byteLength,
      },
      select: { id: true },
    });

    await db.article.update({
      where: { id: article.id },
      data: { coverImage: `/api/images/${image.id}` },
    });

    console.log(`${article.slug}: ${ref} -> /api/images/${image.id} (${resized.byteLength} B)`);
    deletePaths.push(filePath);
    imported += 1;
  }

  for (const p of deletePaths) {
    await unlink(p);
  }

  console.log(`\nimported ${imported}, skipped ${skipped}, deleted ${deletePaths.length} source files`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
