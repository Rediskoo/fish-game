import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function databaseUrlWithServerlessPoolLimit() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl || process.env.NODE_ENV !== "production") return rawUrl;
  if (!rawUrl.startsWith("postgresql://") && !rawUrl.startsWith("postgres://")) return rawUrl;

  const url = new URL(rawUrl);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
  return url.toString();
}

export function getPrisma() {
  if (!globalThis.prisma) {
    const databaseUrl = databaseUrlWithServerlessPoolLimit();
    globalThis.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined
    });
  }

  return globalThis.prisma;
}
