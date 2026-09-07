import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const secret = new TextEncoder().encode(requireEnv("TOKEN_SECRET"));

const stepTokenSchema = z.object({
  sid: z.string(),
  step: z.number().int().positive(),
  nonce: z.string(),
});
export type StepTokenPayload = z.infer<typeof stepTokenSchema>;

const downloadTokenSchema = z.object({
  sid: z.string(),
  fileId: z.string(),
});
export type DownloadTokenPayload = z.infer<typeof downloadTokenSchema>;

const STEP_TOKEN_TTL = "10m";
const DOWNLOAD_TOKEN_TTL = "60s";

export async function signStepToken(payload: StepTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(STEP_TOKEN_TTL)
    .sign(secret);
}

// Returns null on ANY failure (bad signature, expired, wrong shape) rather
// than distinguishing why — callers should show a generic "invalid or
// expired link" message, not leak which check failed.
export async function verifyStepToken(token: string): Promise<StepTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return stepTokenSchema.parse(payload);
  } catch {
    return null;
  }
}

export async function signDownloadToken(payload: DownloadTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DOWNLOAD_TOKEN_TTL)
    .sign(secret);
}

export async function verifyDownloadToken(token: string): Promise<DownloadTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return downloadTokenSchema.parse(payload);
  } catch {
    return null;
  }
}
