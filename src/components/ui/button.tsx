"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { playTone } from "@/stores/sound-store";
import { vibrate } from "@/stores/preferences-store";

export function Button({ className, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(103,232,249,.25)] transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        playTone("button");
        vibrate(10);
        onClick?.(event);
      }}
      {...props}
    />
  );
}
