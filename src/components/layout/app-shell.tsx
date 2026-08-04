"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Gift, Home, Package, Settings, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { AuthRequiredPanel } from "@/features/auth/auth-required-panel";
import { TelegramBootstrap } from "@/features/auth/telegram-bootstrap";
import { usePlayer } from "@/features/auth/use-player";
import { useLiveIncome } from "@/features/income/use-live-income";
import { useIncomeStore } from "@/stores/income-store";

const navItems = [
  { href: "/aquarium", label: "Аквариум", icon: Home },
  { href: "/inventory", label: "Корм", icon: Package },
  { href: "/marketplace", label: "Кейсы", icon: ShoppingBag },
  { href: "/daily-rewards", label: "Награды", icon: Gift },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/settings", label: "Настройки", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const player = usePlayer();
  useLiveIncome(player.data);
  const optimisticCurrency = useIncomeStore((state) => state.optimisticCurrency);
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
    <main className="ocean-shell min-h-dvh pb-[calc(76px+var(--safe-bottom))] pt-[var(--safe-top)]">
      <TelegramBootstrap />
      <div className="pointer-events-none fixed inset-x-0 top-[calc(56px+var(--safe-top))] z-40 flex justify-center">
        <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-cyan-50 shadow-lg">
          <Coins className="h-4 w-4 text-amber-200" />
          {Math.floor(optimisticCurrency || player.data?.user.currency || 0)}
        </div>
      </div>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{content}</div>
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-3 pb-[calc(10px+var(--safe-bottom))]">
        <div className="glass relative flex h-16 items-center justify-around overflow-hidden rounded-2xl px-1">
          <span className="menu-bubble absolute bottom-1 left-[8%] h-2 w-2" />
          <span className="menu-bubble menu-bubble-delayed absolute bottom-3 right-[13%] h-3 w-3" />
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
    </main>
  );
}
