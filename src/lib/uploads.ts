import "server-only";
import { prisma } from "./db";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const DATA_URL_RE = /^data:(image\/(jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

/** Saves a base64 data-url photo under public/uploads; returns web path or null. */
export async function savePhotoDataUrl(dataUrl: string): Promise<string | null> {
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) return null;
  const buffer = Buffer.from(m[3], "base64");
  if (buffer.length > MAX_PHOTO_BYTES) return null;
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");
  const { createHash, randomBytes } = await import("crypto");
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const hash = createHash("sha256")
    .update(randomBytes(8))
    .update(buffer)
    .digest("hex")
    .slice(0, 16);
  const ext = m[2] === "jpeg" ? "jpg" : m[2];
  const name = `${Date.now()}-${hash}.${ext}`;
  await writeFile(join(dir, name), buffer);
  return `/uploads/${name}`;
}

export async function recomputeRating(profileId: string) {
  const agg = await prisma.review.aggregate({
    where: { profileId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.providerProfile.update({
    where: { id: profileId },
    data: {
      ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100,
      ratingCount: agg._count,
    },
  });
}
