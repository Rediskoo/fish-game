"use client";

import { useEffect, useState } from "react";
import { Gamepad2, RotateCcw, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type RevealedCard = { index: number; symbol: string };
type GameState = { gameId: string; cardCount: number; matchedIndices: number[]; moves: number; status: "active" | "completed" | "expired"; expiresAt: string; reward: number; revealed: RevealedCard[]; pairMatched: boolean | null };

export function MatchThreeScreen({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [game, setGame] = useState<GameState | null>(null);
  const [visible, setVisible] = useState<Record<number, string>>({});
  const [locked, setLocked] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => { const initial = window.setTimeout(() => setNow(Date.now()), 0); const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, []);
  const play = useMutation({ mutationFn: (input: { action: "start" } | { action: "flip"; gameId: string; index: number }) => api<GameState>("/api/match-three", { method: "POST", body: JSON.stringify(input) }), onSuccess: (next) => {
    setGame(next);
    setVisible((current) => ({ ...current, ...Object.fromEntries(next.revealed.map((card) => [card.index, card.symbol])) }));
    if (next.pairMatched === false) {
      setLocked(true);
      const indices = next.revealed.map((card) => card.index);
      window.setTimeout(() => { setVisible((current) => { const copy = { ...current }; indices.forEach((index) => delete copy[index]); return copy; }); setLocked(false); }, 850);
    }
    if (next.status === "completed") void queryClient.invalidateQueries({ queryKey: ["snapshot"] });
  } });
  const start = () => { setVisible({}); setLocked(false); play.mutate({ action: "start" }); };
  const flip = (index: number) => { if (!game || locked || play.isPending || game.status !== "active" || game.matchedIndices.includes(index) || visible[index]) return; play.mutate({ action: "flip", gameId: game.gameId, index }); };
  const seconds = game ? Math.max(0, Math.ceil((new Date(game.expiresAt).getTime() - now) / 1000)) : 180;
  const cards = Array.from({ length: game?.cardCount ?? 12 }, (_, index) => index);
  return <div className={embedded ? "space-y-3" : "space-y-4 p-4 pb-8"}>{!embedded ? <header className="pt-20"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-300/15 text-pink-100"><Gamepad2 /></span><div><h1 className="text-3xl font-black text-cyan-50">Найди пару</h1><p className="text-xs text-cyan-100/60">Запоминай, открывай совпадения и забирай водоросли</p></div></div></header> : <div><div className="text-lg font-black text-cyan-50">Найди две одинаковые</div><div className="text-xs text-cyan-100/60">Открой все пары за три минуты</div></div>}
    <Panel className="space-y-4 bg-[radial-gradient(circle_at_top,rgba(236,72,153,.24),transparent_42%),linear-gradient(145deg,rgba(76,29,149,.72),rgba(8,47,73,.88))]">
      <div className="flex items-center justify-between text-xs font-black"><span>Ходы: {game?.moves ?? 0}</span><span className={seconds < 30 ? "text-rose-200" : "text-cyan-100"}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span><span>Пары: {(game?.matchedIndices.length ?? 0) / 2}/6</span></div>
      <div className="grid grid-cols-4 gap-2">{cards.map((index) => { const matched = game?.matchedIndices.includes(index) ?? false; const symbol = visible[index]; const open = matched || Boolean(symbol); return <button type="button" aria-label={open ? `Открытая карточка ${symbol ?? "совпадение"}` : `Закрытая карточка ${index + 1}`} key={index} disabled={!game || locked || play.isPending || matched || game.status !== "active"} onClick={() => flip(index)} className={`relative grid aspect-[.82] place-items-center rounded-2xl border text-3xl shadow-lg transition duration-300 ${open ? "rotate-0 border-cyan-200/35 bg-cyan-50/15" : "border-pink-200/20 bg-[linear-gradient(145deg,rgba(15,23,42,.96),rgba(88,28,135,.88))] active:scale-95"}`}><span className={open ? "scale-100 opacity-100 transition" : "scale-50 opacity-0"}>{symbol ?? (matched ? "✓" : "?")}</span>{!open ? <span className="absolute text-xl text-pink-200/55">🐚</span> : null}</button>; })}</div>
      {!game ? <Button className="w-full bg-pink-300" disabled={play.isPending} onClick={start}><Sparkles className="h-4 w-4" /> Начать игру</Button> : null}
      {game?.status === "completed" ? <div className="space-y-3 rounded-2xl bg-emerald-300/15 p-4 text-center"><div className="text-xl font-black text-emerald-100">Все пары найдены!</div><div className="text-2xl font-black text-amber-100">+{game.reward} водорослей</div><Button className="w-full" onClick={start}><RotateCcw className="h-4 w-4" /> Ещё партию</Button></div> : null}
      {game?.status === "active" && seconds === 0 ? <Button className="w-full" onClick={start}><RotateCcw className="h-4 w-4" /> Начать заново</Button> : null}
      {play.error ? <p className="text-center text-sm text-amber-100">{play.error.message}</p> : null}
    </Panel><p className="px-2 text-center text-xs text-cyan-100/48">Награда выше за меньшее число ходов · результат проверяет сервер</p></div>;
}
