import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile?.();
} catch {
  // Production environments provide real env vars; local runs may not have .env yet.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
