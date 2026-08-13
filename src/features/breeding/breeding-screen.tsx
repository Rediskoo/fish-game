"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Dna, Egg, Heart, Search, Sparkles, Zap } from "lucide-react";
import { aquariumAnimations, aquariumAssets } from "@/assets/aquarium-assets";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { breedingSpeciesKey, findHybrid } from "@/features/breeding/breeding-genetics";
import { developmentProgress } from "@/features/breeding/breeding-time";
import type { BreedingJobView } from "@/features/breeding/types";
import { useBreeding, useBreedingAction, useStartBreeding } from "@/features/breeding/use-breeding";
import { usePlayer } from "@/features/auth/use-player";
import { fishVisualAsset } from "@/lib/app-assets";
import type { FishView } from "@/types/game";

const stageLabels = { egg: "Икра", embryo: "Эмбрионы", hatching: "Вылупление", fry: "Мальки", baby: "Малыш", adult: "Взрослая рыба" };

function visual(job: BreedingJobView) {
  if (job.lifeStage === "egg") return aquariumAnimations.eggsIncubating.animatedFile!;
  if (job.lifeStage === "embryo") return aquariumAssets.breeding.eggsEmbryo;
  if (job.lifeStage === "hatching") return aquariumAnimations.eggsHatching.animatedFile!;
  if (job.lifeStage === "fry") return aquariumAnimations.frySchoolIdle.animatedFile!;
  if (job.hybridKey.endsWith("-pure")) return aquariumAssets.breeding.offspring(job.hybridKey);
  return aquariumAnimations.babySwim(job.hybridKey).animatedFile ?? aquariumAssets.breeding.offspring(job.hybridKey);
}

function remaining(target: string, now: number) {
  const seconds = Math.max(0, Math.ceil((new Date(target).getTime() - now) / 1000));
  return `${Math.floor(seconds / 3600)}ч ${Math.floor(seconds % 3600 / 60)}м ${seconds % 60}с`;
}

export function BreedingScreen() {
  const player = usePlayer();
  const breeding = useBreeding();
  const start = useStartBreeding();
  const action = useBreedingAction();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("ALL");
  const [favorites, setFavorites] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const displayNow = now ?? new Date(breeding.data?.serverNow ?? 0).getTime();
  const fish = useMemo(() => player.data?.fish ?? [], [player.data?.fish]);
  const parentA = fish.find((item) => item.id === selected[0]) ?? null;
  const parentB = fish.find((item) => item.id === selected[1]) ?? null;
  const hybrid = parentA && parentB ? findHybrid(breedingSpeciesKey(parentA), breedingSpeciesKey(parentB)) : null;
  const filtered = useMemo(() => fish.filter((item) => `${item.name} ${item.displayName}`.toLowerCase().includes(query.toLowerCase()) && (rarity === "ALL" || item.rarity === rarity) && (!favorites || item.isFavorite)), [fish, query, rarity, favorites]);
  const choose = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);

  return <div className="space-y-4 overflow-x-hidden p-3 pb-8 sm:p-4">
    <header className="pt-20"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-300/15 text-amber-100"><Egg /></span><div><h1 className="text-2xl font-black text-cyan-50 sm:text-3xl">Скрещивание</h1><p className="text-xs text-cyan-100/60">Питомник гибридных рыб</p></div></div></header>
    {(breeding.data?.jobs ?? []).filter((job) => !["completed", "cancelled"].includes(job.status)).map((job) => <Panel key={job.id} className="relative overflow-hidden p-0">
      <img src={job.lifeStage === "fry" ? aquariumAssets.backgrounds.moonlitFryLagoon : job.lifeStage === "baby" || job.lifeStage === "adult" ? aquariumAssets.backgrounds.pearlNursery : aquariumAssets.backgrounds.spawningCove} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="relative space-y-3 p-4"><div className="flex justify-between gap-2"><div><div className="text-xs uppercase text-cyan-100/60">{stageLabels[job.lifeStage]}</div><div className="font-black text-cyan-50">{job.parentA.displayName} × {job.parentB.displayName}</div></div><span className="h-fit rounded-full bg-slate-950/55 px-2 py-1 text-[10px] uppercase">{job.rarity}</span></div>
      <img loading="lazy" draggable={false} className="mx-auto h-40 w-40 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,.5)]" src={visual(job)} alt="" />
      <div className="h-2 overflow-hidden rounded-full bg-slate-950/55"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${developmentProgress(job, new Date(displayNow)) * 100}%` }} /></div>
      <div className="flex justify-between text-xs text-cyan-100/75"><span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{job.lifeStage === "adult" ? "Готово" : remaining(job.adultAt, displayNow)}</span><span>{job.speedupsUsed}/3</span></div>
      {job.lifeStage !== "adult" ? <div className="space-y-2 rounded-2xl border border-amber-200/20 bg-slate-950/45 p-3"><div className="flex items-center justify-between text-xs"><span className="font-black text-amber-100">Ускорение развития</span><span className="text-cyan-100/60">использовано {job.speedupsUsed}/3</span></div><Button className="w-full bg-cyan-300 text-slate-950" disabled={action.isPending || !breeding.data?.inventory.eggIncubator || !(job.lifeStage === "egg" || job.lifeStage === "embryo")} onClick={() => action.mutate({ jobId: job.id, action: "incubate" })}><Zap className="h-4 w-4" /> Инкубатор −1 час · {breeding.data?.inventory.eggIncubator ?? 0}</Button><Button className="w-full bg-amber-300 text-slate-950" disabled={action.isPending || !breeding.data?.inventory.fryFood || job.speedupsUsed >= 3 || !(job.lifeStage === "fry" || job.lifeStage === "baby")} onClick={() => action.mutate({ jobId: job.id, action: "speed-up" })}><Zap className="h-4 w-4" /> Корм для мальков −2 часа · {breeding.data?.inventory.fryFood ?? 0}</Button><Button className="w-full bg-emerald-300 text-slate-950" disabled={action.isPending || !breeding.data?.inventory.nurseryConditioner} onClick={() => action.mutate({ jobId: job.id, action: "condition" })}><Sparkles className="h-4 w-4" /> Кондиционер −30 минут · {breeding.data?.inventory.nurseryConditioner ?? 0}</Button><p className="text-[11px] text-cyan-100/55">Ускорители покупаются в разделе «Питомник» магазина и видны на складе.</p></div> : null}
      {(breeding.data?.inventory.genealogyMedallion ?? 0) > 0 ? <div className="rounded-2xl border border-violet-200/20 bg-violet-300/10 p-3 text-xs"><div className="font-black text-violet-100">Родословная</div><div className="mt-1 text-cyan-100/70">{job.parentA.displayName} × {job.parentB.displayName}</div><div className="mt-1 text-cyan-100/55">Геном: {job.genome.primaryColor}, {job.genome.pattern}, хвост {job.genome.tailShape}</div></div> : null}
      {job.lifeStage === "adult" ? <Button className="w-full bg-emerald-300" disabled={action.isPending} onClick={() => action.mutate({ jobId: job.id, action: "claim" })}><Check className="h-4 w-4" /> Забрать рыбу</Button> : null}</div>
    </Panel>)}
    <Panel className="space-y-4"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><Slot fish={parentA} label="Родитель A" /><Sparkles className="h-5 w-5 text-amber-200" /><Slot fish={parentB} label="Родитель B" /></div>
      {parentA && parentB ? <div className="rounded-2xl bg-slate-950/35 p-3">{hybrid ? <div className="flex items-center gap-3"><img className="h-20 w-20 object-contain" src={aquariumAssets.breeding.offspring(hybrid.key)} alt="" /><div><div className="flex items-center gap-1 font-black"><Dna className="h-4 w-4" />{hybrid.key}</div><div className="text-xs text-cyan-100/65">{hybrid.config.rarity} · 12 часов</div></div></div> : <p className="text-sm text-amber-100">Для этой пары нет готового визуального варианта.</p>}</div> : null}
      <Button className="w-full" disabled={!hybrid || !parentA || !parentB || start.isPending || !breeding.data?.inventory.spawningNest} onClick={() => parentA && parentB && start.mutate({ parentAId: parentA.id, parentBId: parentB.id, idempotencyKey: crypto.randomUUID() })}><Egg className="h-4 w-4" /> Начать · гнёзд {breeding.data?.inventory.spawningNest ?? 0}</Button>
      {start.error || action.error ? <p className="text-sm text-rose-200">{(start.error ?? action.error)?.message}</p> : null}</Panel>
    <div className="space-y-3"><div className="flex gap-2"><label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-cyan-100/45" /><input className="h-10 w-full rounded-xl border border-cyan-100/15 bg-slate-950/35 pl-9 pr-3 text-sm" placeholder="Имя или вид" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" onClick={() => setFavorites(!favorites)} className={`h-10 w-10 rounded-xl border ${favorites ? "bg-pink-300/15 text-pink-200" : "text-cyan-100/60"}`}><Heart className="mx-auto h-4 w-4" /></button></div>
    <div className="flex gap-2 overflow-x-auto">{["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY"].map((item) => <button type="button" key={item} onClick={() => setRarity(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${rarity === item ? "bg-cyan-300 text-slate-950" : "bg-slate-950/35"}`}>{item}</button>)}</div>
    <div className="grid grid-cols-2 gap-2">{filtered.map((candidate) => <Card key={candidate.id} fish={candidate} selected={selected.includes(candidate.id)} first={parentA} onClick={() => choose(candidate.id)} />)}</div></div>
  </div>;
}

function Slot({ fish, label }: { fish: FishView | null; label: string }) { return <div className="min-w-0 rounded-2xl bg-slate-950/35 p-2 text-center"><div className="text-[10px] uppercase text-cyan-100/50">{label}</div>{fish ? <><img className="mx-auto h-16 w-16 object-contain" src={fishVisualAsset(fish)} alt="" /><div className="truncate text-xs font-bold">{fish.name}</div></> : <div className="grid h-20 place-items-center text-xs text-cyan-100/40">Выберите</div>}</div>; }
function Card({ fish, selected, first, onClick }: { fish: FishView; selected: boolean; first: FishView | null; onClick: () => void }) { const adult = fish.lifeStage === "ADULT"; const compatible = !first || first.id === fish.id || Boolean(findHybrid(breedingSpeciesKey(first), breedingSpeciesKey(fish))); const ready = adult && !fish.breedingLocked && compatible; const reason = !adult ? "Не взрослая" : fish.breedingLocked ? "Занята" : !compatible ? "Нет визуала" : "Готова"; return <button type="button" disabled={!ready && !selected} onClick={onClick} className={`min-w-0 rounded-2xl border p-3 text-left ${selected ? "border-cyan-300 bg-cyan-300/10" : ready ? "border-cyan-100/12 bg-slate-950/30" : "opacity-45"}`}><div className="flex gap-2"><img className="h-14 w-14 shrink-0 object-contain" src={fishVisualAsset(fish)} alt="" /><div className="min-w-0"><div className="truncate text-sm font-black">{fish.name}</div><div className="truncate text-[10px] text-cyan-100/55">{fish.displayName}</div><div className={`text-[10px] ${ready ? "text-emerald-200" : "text-amber-200"}`}>{reason}</div></div></div><div className="mt-2 flex justify-between text-[10px] text-cyan-100/55"><span>{fish.rarity}</span><span>голод {Math.round(fish.hunger / Math.max(1, fish.maxHunger) * 100)}%</span></div></button>; }
