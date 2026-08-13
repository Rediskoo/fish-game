"use client";

import { useEffect, useState } from "react";
import { Fish, Gift, ShoppingBasket, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const storageKey = "aquarium-onboarding-v1";
const steps = [
  { icon: Fish, title: "Добро пожаловать!", text: "Рыбки приносят водоросли даже когда приложение закрыто. Следи за их сытостью — голод снижает доход." },
  { icon: ShoppingBasket, title: "Уход и развитие", text: "Корми рыбок на складе, очищай воду и покупай декор. В аквариуме одновременно живут до 20 рыб." },
  { icon: Gift, title: "Награды и друзья", text: "Забирай ежедневный подарок, открывай рыбные кейсы, добавляй друзей и обменивайся подарками." }
];

export function Onboarding() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.localStorage.getItem(storageKey) !== "done") setStep(0);
    }, 0);
    const restart = () => setStep(0);
    window.addEventListener("aquarium:restart-onboarding", restart);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("aquarium:restart-onboarding", restart);
    };
  }, []);

  if (step === null) return null;
  const current = steps[step];
  const Icon = current.icon;
  const close = () => {
    window.localStorage.setItem(storageKey, "done");
    setStep(null);
  };

  return (
    <div data-app-modal="true" className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <section className="glass relative w-full max-w-sm rounded-[28px] p-6 text-center">
        <button type="button" onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-cyan-100/70" aria-label="Закрыть обучение"><X className="h-5 w-5" /></button>
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-cyan-300/15 text-cyan-100"><Icon className="h-10 w-10" /></div>
        <div className="mb-3 flex justify-center gap-2" aria-label={`Шаг ${step + 1} из ${steps.length}`}>
          {steps.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === step ? "w-8 bg-cyan-300" : "w-3 bg-cyan-100/25"}`} />)}
        </div>
        <h2 id="onboarding-title" className="text-2xl font-black text-cyan-50">{current.title}</h2>
        <p className="mt-3 min-h-20 text-sm leading-6 text-cyan-100/75">{current.text}</p>
        <Button className="mt-5 w-full" onClick={() => step === steps.length - 1 ? close() : setStep(step + 1)}>
          {step === steps.length - 1 ? <><Sparkles className="h-4 w-4" /> Начать игру</> : "Далее"}
        </Button>
      </section>
    </div>
  );
}
