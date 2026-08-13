"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Sparkles } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type Result = { board: string[][]; matches: number; reward: number; nextPlayAt: string };

export function MatchThreeScreen() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<Result | null>(null);
  const play = useMutation({ mutationFn: () => api<Result>("/api/match-three", { method: "POST" }), onSuccess: (data) => { setResult(data); void queryClient.invalidateQueries({ queryKey: ["snapshot"] }); } });
  return <div className="space-y-4 p-4 pb-8"><header className="pt-20"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-300/15 text-pink-100"><Gamepad2 /></span><div><h1 className="text-3xl font-black text-cyan-50">Три в ряд</h1><p className="text-xs text-cyan-100/60">Собирай рыбные совпадения и получай водоросли</p></div></div></header><Panel className="space-y-4 bg-[linear-gradient(145deg,rgba(76,29,149,.64),rgba(8,47,73,.82))]"><div className="grid grid-cols-6 gap-1.5">{(result?.board ?? Array.from({ length: 6 }, () => Array(6).fill("❔"))).flatMap((row, rowIndex) => row.map((symbol, columnIndex) => <div key={`${rowIndex}-${columnIndex}`} className="grid aspect-square place-items-center rounded-xl border border-white/10 bg-slate-950/35 text-2xl shadow-inner transition hover:scale-105">{symbol}</div>))}</div>{result ? <div className="rounded-2xl bg-emerald-300/14 p-3 text-center"><div className="font-black text-emerald-100"><Sparkles className="mr-1 inline h-4 w-4" />Совпадений: {result.matches}</div><div className="mt-1 text-2xl font-black text-amber-100">+{result.reward} водорослей</div></div> : <p className="text-center text-sm text-cyan-100/65">Нажми «Играть»: поле и награда формируются на сервере.</p>}<Button className="w-full bg-pink-300" disabled={play.isPending} onClick={() => play.mutate()}>{play.isPending ? "Мешаем рыбок…" : "Играть"}</Button>{play.error ? <p className="text-center text-sm text-amber-100">{play.error.message}</p> : null}</Panel><p className="px-2 text-center text-xs text-cyan-100/48">Одна партия каждые 30 секунд · награда 5–75</p></div>;
}
