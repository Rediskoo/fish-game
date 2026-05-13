"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fish, Gift, Home, Package, Settings, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { AuthRequiredPanel } from "@/features/auth/auth-required-panel";
import { TelegramBootstrap } from "@/features/auth/telegram-bootstrap";
import { usePlayer } from "@/features/auth/use-player";

const navItems = [
  { href: "/aquarium", label: "Аквариум", icon: Home },
  { href: "/marketplace", label: "Маркет", icon: ShoppingBag },
  { href: "/inventory", label: "Корм", icon: Package },
  { href: "/daily-rewards", label: "Награды", icon: Gift },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/settings", label: "Настройки", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const player = usePlayer();
  const content = player.isError ? (
    <AuthRequiredPanel />
  ) : player.isPending ? (
    <div className="grid min-h-[calc(100dvh-96px-var(--safe-top)-var(--safe-bottom))] place-items-center p-4 text-sm text-cyan-100/70">
      Загрузка аквариума...
    </div>
  ) : (
    children
  );

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_20%_0%,rgba(30,168,220,.26),transparent_35%),linear-gradient(180deg,#04121d,#06283a_50%,#031018)] pb-[calc(76px+var(--safe-bottom))] pt-[var(--safe-top)]">
      <TelegramBootstrap />
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{content}</div>
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-3 pb-[calc(10px+var(--safe-bottom))]">
        <div className="glass grid h-16 grid-cols-6 rounded-2xl px-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-sky-100/60 transition",
                  active && "bg-cyan-300/16 text-cyan-100"
                )}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <Fish className="pointer-events-none fixed right-4 top-5 h-6 w-6 text-cyan-100/20" />
    </main>
  );
}
