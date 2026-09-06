const DURATIONS_MS: Record<string, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

// `defaultExpiry` is admin-controlled (Setting row), not user input — an
// unrecognized value means the data is corrupt, so this throws rather than
// silently picking a fallback duration.
export function computeExpiresAt(defaultExpiry: string, now: Date = new Date()): Date | null {
  if (defaultExpiry === "never") return null;

  const ms = DURATIONS_MS[defaultExpiry];
  if (ms === undefined) {
    throw new Error(`Unknown expiry duration: "${defaultExpiry}"`);
  }

  return new Date(now.getTime() + ms);
}
