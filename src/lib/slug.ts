import { randomBytes } from "node:crypto";

// 128 bits of entropy, URL-safe. Used for publicSlug/finalSlug (these ARE the
// download link — must not be guessable) and for on-disk storedName.
export function randomSlug(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}

export function randomStoredName(extension: string): string {
  const ext = extension.replace(/^\.+/, "");
  return `${randomSlug(16)}.${ext}`;
}
