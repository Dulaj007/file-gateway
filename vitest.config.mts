import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      // Hermetic test secret — unit tests must not depend on .env.local.
      TOKEN_SECRET: "test-only-token-secret-not-for-real-use",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
