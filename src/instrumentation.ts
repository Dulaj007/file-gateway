// Runs once when the Next.js server instance starts (see
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation).
// This is where the self-cleaning-storage job (SDD Phase 8) gets scheduled
// for as long as the app process itself is running — see the README's
// "Cleanup" section for the system-cron fallback for anyone who'd rather
// schedule it externally instead of relying on this.
export async function register() {
  // instrumentation runs in both the Node.js and Edge runtimes; node-cron
  // and fs/Prisma only work in Node.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Guard against double-scheduling: Next dev can re-invoke register() on
  // certain reloads without a full process restart, and cron.schedule()
  // has no built-in dedupe — a second call would just run cleanup twice
  // as often, not error, so nothing would surface this without a guard.
  const globalForCleanup = globalThis as unknown as { cleanupScheduled?: boolean };
  if (globalForCleanup.cleanupScheduled) return;
  globalForCleanup.cleanupScheduled = true;

  const [{ default: cron }, { runCleanup }] = await Promise.all([
    import("node-cron"),
    import("@/lib/cleanup"),
  ]);

  async function tick() {
    try {
      const result = await runCleanup();
      console.log("[cleanup]", result);
    } catch (err) {
      console.error("[cleanup] failed:", err);
    }
  }

  cron.schedule("*/15 * * * *", tick);
  console.log("[cleanup] scheduled every 15 minutes");

  // Also run once at startup rather than waiting up to 15 minutes for the
  // first pass — matters most right after a deploy/restart.
  void tick();
}
