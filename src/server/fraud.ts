import { createHash } from "node:crypto";

/**
 * Privacy-safe, one-way identifier for the request's IP address. Not raw-IP
 * storage — just enough to power future fraud-prevention rules (duplicate
 * accounts, suspicious completion speed, etc.) without keeping PII around.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function getRequestIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}
