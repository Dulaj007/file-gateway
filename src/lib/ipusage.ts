import { db } from "@/lib/db";

// Next.js route handlers get a Web-standard Request — there's no `request.ip`
// (removed from NextRequest in v15, and its replacement is Vercel-only).
// Self-hosted behind Caddy, x-forwarded-for is the correct, trustworthy
// source since Caddy overwrites it with the real connection's address.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1"; // direct connection, e.g. local dev with no reverse proxy
}

export type IpUsage = { uploadCount: number; totalBytes: bigint };
export type IpQuotaLimits = { ipDailyMaxUploads: number; ipDailyMaxBytes: bigint };
export type QuotaResult = { ok: true } | { ok: false; reason: string };

// Pure math, kept separate from the DB query below so it's trivial to unit
// test (SDD §14: "storage-cap and per-IP math").
export function evaluateIpQuota(
  usage: IpUsage,
  incomingBytes: bigint,
  limits: IpQuotaLimits
): QuotaResult {
  if (usage.uploadCount >= limits.ipDailyMaxUploads) {
    return { ok: false, reason: "Daily upload limit reached for this IP." };
  }
  if (usage.totalBytes + incomingBytes > limits.ipDailyMaxBytes) {
    return { ok: false, reason: "Daily upload size limit reached for this IP." };
  }
  return { ok: true };
}

function startOfDayUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getIpUsageToday(ip: string, now: Date = new Date()): Promise<IpUsage> {
  const files = await db.fileItem.findMany({
    where: { uploaderIp: ip, createdAt: { gte: startOfDayUtc(now) } },
    select: { sizeBytes: true },
  });

  return {
    uploadCount: files.length,
    totalBytes: files.reduce((sum, f) => sum + f.sizeBytes, 0n),
  };
}

export async function checkIpQuota(
  ip: string,
  incomingBytes: bigint,
  limits: IpQuotaLimits,
  now: Date = new Date()
): Promise<QuotaResult> {
  const usage = await getIpUsageToday(ip, now);
  return evaluateIpQuota(usage, incomingBytes, limits);
}
