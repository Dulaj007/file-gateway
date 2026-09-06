import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma 7's CLI no longer auto-loads .env files, unlike Next.js — load our
// local dev values explicitly so `prisma migrate dev` etc. see DATABASE_URL.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
