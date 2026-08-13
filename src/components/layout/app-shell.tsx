"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { aquariumAssets } from "@/assets/aquarium-assets";
import { AuthRequiredPanel } from "@/features/auth/auth-required-panel";
import { TelegramBootstrap } from "@/features/auth/telegram-bootstrap";
import { usePlayer } from "@/features/auth/use-player";
import { useFriends } from "@/features/friends/use-friends";
import { useLiveIncome } from "@/features/income/use-live-income";
import { cn } from "@/lib/cn";
import { useIncomeStore } from "@/stores/income-store";
import { Onboarding } from "@/components/layout/onboarding";
import { ApiError } from "@/lib/api/client";
import { LanguageTranslator } from "@/components/layout/language-translator";
import { usePreferencesStore } from "@/stores/preferences-store";

const navItems = [
  { href: "/aquarium", label: "Главная", icon: aquariumAssets.icons.navigation.home },
  { href: "/breeding", label: "Питомник", icon: aquariumAssets.icons.navigation.gifts },
  { href: "/inventory", label: "Склад", icon: aquariumAssets.icons.navigation.storage },
  { href: "/marketplace", label: "Магазин", icon: aquariumAssets.icons.navigation.shop },
  { href: "/daily-rewards", label: "Подарки", icon: aquariumAssets.icons.navigation.gifts },
  { href: "/profile", label: "Профиль", icon: aquariumAssets.icons.navigation.profile },
  { href: "/settings", label: "Настройки", icon: aquariumAssets.icons.navigation.settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const player = usePlayer();
  const friends = useFriends(Boolean(player.data));
  const [hasModal, setHasModal] = useState(false);
  const theme = usePreferencesStore((state) => state.theme);
  useLiveIncome(player.data);
  const optimisticCurrency = useIncomeStore((state) => state.optimisticCurrency);
  const profileNeedsAttention = Boolean(friends.data?.friends.some((friend) => friend.pendingGift) || friends.data?.requests.some((request) => request.direction === "incoming"));

  useEffect(() => {
    const checkModals = () => setHasModal(Boolean(document.querySelector("[data-app-modal='true']")));
    checkModals();
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-app-modal"], childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const content = player.isError && player.error instanceof ApiError && player.error.status === 401 ? (
    <AuthRequiredPanel />
  ) : player.isError ? (
    <div className="grid min-h-[calc(100dvh-96px-var(--safe-top)-var(--safe-bottom))] place-items-center p-4">
      <div className="glass max-w-sm space-y-3 rounded-3xl p-5 text-center">
        <h1 className="text-xl font-black text-cyan-50">Не удалось загрузить аквариум</h1>
        <p className="text-sm text-cyan-100/70">Авторизация сохранена, но сервер временно недоступен.</p>
        <button className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950" type="button" onClick={() => void player.refetch()}>Повторить</button>
      </div>
    </div>
  ) : player.isPending ? (
    <div className="grid min-h-[calc(100dvh-96px-var(--safe-top)-var(--safe-bottom))] place-items-center p-4 text-sm text-cyan-100/70">
      Загрузка аквариума...
    </div>
  ) : (
    children
  );

  return (
    <main className={cn("ocean-shell relative min-h-dvh overflow-hidden pb-[calc(128px+var(--safe-bottom))] pt-[var(--safe-top)]", theme === "night" && "brightness-[.82] saturate-[.8]")}>
      <TelegramBootstrap />
      <LanguageTranslator />
      <Onboarding />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <span className="screen-glow absolute left-[8%] top-[14%] h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" />
        <span className="screen-glow screen-glow-delayed absolute right-[5%] top-[48%] h-40 w-40 rounded-full bg-blue-300/8 blur-3xl" />
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="screen-bubble absolute rounded-full border border-cyan-100/45 bg-cyan-100/8"
            style={{
              left: String((index * 23) % 100) + "%",
              bottom: String(-12 - (index % 5) * 9) + "%",
              width: String(5 + (index % 5) * 2) + "px",
              height: String(5 + (index % 5) * 2) + "px",
              animationDelay: String(index * 310) + "ms",
              animationDuration: String(6800 + (index % 6) * 850) + "ms"
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-[calc(56px+var(--safe-top))] z-40 flex justify-center">
        <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-cyan-50 shadow-lg">
          <img className="h-5 w-5" src={aquariumAssets.icons.ui.currencyCoin} alt="" />
          {Math.floor(optimisticCurrency || player.data?.user.currency || 0)}
        </div>
      </div>
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col">{content}</div>
      <nav className={cn("fixed inset-x-0 bottom-[calc(14px+var(--safe-bottom))] z-50 mx-auto max-w-md px-3 transition duration-200", hasModal && "pointer-events-none translate-y-6 opacity-0")}>
        <div className="glass relative flex h-20 items-center justify-start overflow-x-auto rounded-3xl px-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative mx-auto flex h-16 min-w-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-sky-100/72 transition active:scale-95",
                  active && "bg-cyan-300/18 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,.16)]"
                )}
                aria-label={item.label}
                title={item.label}
              >
                <img className="h-5 w-5" src={active ? item.icon.active : item.icon.inactive} alt="" />
                {item.href === "/profile" && profileNeedsAttention ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,.8)]" /> : null}
                <span className="max-w-14 truncate text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
