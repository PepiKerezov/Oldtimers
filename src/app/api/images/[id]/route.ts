import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const image = await db.image.findUnique({
    where: { id },
    select: { mimeType: true, bytes: true },
  });

  if (!image) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.bytes), {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.bytes.byteLength),
    },
  });
}
