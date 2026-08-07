"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Droplets, Eye, Fish, Utensils, X } from "lucide-react";
import { AquariumRenderer } from "@/components/aquarium/aquarium-renderer";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/features/auth/use-player";
import { api } from "@/lib/api/client";
import { splitFishByCapacity } from "@/lib/fish-capacity";
import type { AquariumSnapshot } from "@/types/game";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function AquariumClient() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const player = usePlayer();
  const devLogin = useMutation({
    mutationFn: () => api<AquariumSnapshot>("/api/auth/dev", { method: "POST" }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
  const fish = player.data?.fish ?? [];
  const { aquariumFish } = splitFishByCapacity(fish);
  const backgroundId = player.data?.aquarium.backgroundId;
  const decor = player.data?.aquarium.decor ?? [];
  const pollution = player.data?.aquarium.pollution ?? 0;
  const [observeMode, setObserveMode] = useState(false);
  const cleaner = player.data?.inventory.cleaner ?? 0;
  const cleanAquarium = useMutation({
    mutationFn: () => api<AquariumSnapshot>("/api/aquarium", { method: "PATCH", body: JSON.stringify({ clean: true }) }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
  const cleanliness = Math.max(0, 100 - pollution * 4);
  const averageSatiety = aquariumFish.length
    ? Math.round(aquariumFish.reduce((sum, item) => sum + Math.max(0, item.maxHunger - item.hunger) / item.maxHunger, 0) / aquariumFish.length * 100)
    : 0;

  return (
    <div className="absolute inset-0">
      <AquariumRenderer fish={aquariumFish} backgroundId={backgroundId} decor={decor} pollution={pollution} />
      {pollution > 15 ? (
        <button
          className="absolute left-4 right-4 top-[calc(104px+var(--safe-top))] z-40 flex items-center gap-3 rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,rgba(113,63,18,.74),rgba(9,39,51,.70))] px-3 py-2 text-left text-xs font-bold text-amber-100 shadow-[0_16px_40px_rgba(0,0,0,.28)] backdrop-blur transition active:scale-[.99]"
          disabled={cleanAquarium.isPending}
          onClick={() => cleaner > 0 ? cleanAquarium.mutate() : router.push("/marketplace")}
          type="button"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/18 text-amber-100"><AlertTriangle className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">Аквариум загрязнён</span>
            <span className="block truncate text-amber-100/72">{cleaner > 0 ? "Используйте очиститель" : "Купите очиститель в магазине"}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-cyan-100" />
        </button>
      ) : null}
      <div className="absolute left-4 right-4 top-[calc(168px+var(--safe-top))] z-30 grid grid-cols-3 gap-2 text-[11px] font-black text-cyan-50">
        <AquariumStat icon={<Droplets className="h-3.5 w-3.5" />} label="Чистота" value={`${cleanliness}%`} tone="lime" />
        <AquariumStat icon={<Fish className="h-3.5 w-3.5" />} label="Рыбки" value={`${aquariumFish.length}/${fish.length}`} tone="cyan" />
        <AquariumStat icon={<Utensils className="h-3.5 w-3.5" />} label="Сытость" value={`${averageSatiety}%`} tone="amber" />
      </div>
      <Button className="absolute right-4 bottom-24 z-40 h-11 w-11 px-0" onClick={() => setObserveMode(true)} aria-label="Режим наблюдения">
        <Eye className="h-5 w-5" />
      </Button>
      {observeMode ? (
        <div className="fixed inset-0 z-[70] bg-[#031018]">
          <AquariumRenderer fish={aquariumFish} backgroundId={backgroundId} decor={decor} pollution={pollution} className="min-h-dvh rounded-none" interactive />
          <Button className="absolute right-4 top-[calc(94px+var(--safe-top))] z-10 h-11 w-11 bg-cyan-100 px-0" onClick={() => setObserveMode(false)} aria-label="Выйти из режима наблюдения">
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
      {player.isError ? (
        <div className="absolute inset-x-4 top-24 rounded-2xl border border-cyan-200/15 bg-slate-950/70 p-4 text-sm text-cyan-50">
          <p>РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕР±С‰РёР№ Р°РєРІР°СЂРёСѓРј. РџРѕРїСЂРѕР±СѓР№ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ.</p>
          {process.env.NODE_ENV !== "production" ? (
            <button
              className="mt-3 rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950"
              disabled={devLogin.isPending}
              onClick={() => devLogin.mutate()}
            >
              Р›РѕРєР°Р»СЊРЅС‹Р№ dev-РІС…РѕРґ
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AquariumStat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "lime" | "cyan" | "amber" }) {
  const color = tone === "lime" ? "bg-lime-300" : tone === "amber" ? "bg-amber-300" : "bg-cyan-300";
  return (
    <div className="rounded-xl border border-cyan-100/14 bg-slate-950/48 p-2 shadow-[0_12px_30px_rgba(0,0,0,.24)] backdrop-blur">
      <div className="flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1 text-cyan-100/72">{icon}<span className="truncate">{label}</span></span>
        <span className="text-cyan-50">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-950/70">
        <div className={`h-full rounded-full ${color}`} style={{ width: value.includes("/") ? "100%" : value }} />
      </div>
    </div>
  );
}
