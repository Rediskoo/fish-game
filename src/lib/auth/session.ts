import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db/prisma";
import { requireEnv } from "@/lib/env";
import { PlayerService } from "@/server/services/player.service";

const sessionCookieName = "aquarium_session";
const sharedGuestTelegramId = 1000001;

function getSecret() {
  return new TextEncoder().encode(requireEnv("JWT_SECRET"));
}

export async function createSession(userId: string, telegramId: string) {
  return new SignJWT({ userId, telegramId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return getSharedGuestUserId();

  try {
    const result = await jwtVerify(token, getSecret());
    return result.payload.userId as string;
  } catch {
    return getSharedGuestUserId();
  }
}

async function getSharedGuestUserId() {
  const snapshot = await new PlayerService(getPrisma()).syncTelegramUser({
    id: sharedGuestTelegramId,
    first_name: "Guest",
    username: "shared_aquarist"
  });
  return snapshot.user.id;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
