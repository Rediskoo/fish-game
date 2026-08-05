"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { AquariumRenderer } from "@/components/aquarium/aquarium-renderer";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/features/auth/use-player";
import { api } from "@/lib/api/client";
import type { AquariumSnapshot } from "@/types/game";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function AquariumClient() {
  const queryClient = useQueryClient();
  const player = usePlayer();
  const devLogin = useMutation({
    mutationFn: () => api<AquariumSnapshot>("/api/auth/dev", { method: "POST" }),
    onSuccess: (snapshot) => queryClient.setQueryData(["snapshot"], snapshot)
  });
  const fish = player.data?.fish ?? [];
  const backgroundId = player.data?.aquarium.backgroundId;
  const decor = player.data?.aquarium.decor ?? [];
  const pollution = player.data?.aquarium.pollution ?? 0;
  const [observeMode, setObserveMode] = useState(false);

  return (
    <div className="absolute inset-0">
      <AquariumRenderer fish={fish} backgroundId={backgroundId} decor={decor} pollution={pollution} />
      {pollution > 15 ? (
        <div className="absolute left-4 right-4 top-[calc(92px+var(--safe-top))] z-40 rounded-2xl border border-amber-200/30 bg-amber-950/62 p-3 text-sm font-bold text-amber-100 shadow-[0_16px_40px_rgba(0,0,0,.28)] backdrop-blur">
          Грязный аквариум · используй очиститель на складе
        </div>
      ) : null}
      <Button className="absolute right-4 bottom-24 z-40 h-11 w-11 px-0" onClick={() => setObserveMode(true)} aria-label="Режим наблюдения">
        <Eye className="h-5 w-5" />
      </Button>
      {observeMode ? (
        <div className="fixed inset-0 z-[70] bg-[#031018]">
          <AquariumRenderer fish={fish} backgroundId={backgroundId} decor={decor} pollution={pollution} className="min-h-dvh rounded-none" interactive />
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
