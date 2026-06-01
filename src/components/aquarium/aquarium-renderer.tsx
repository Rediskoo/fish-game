"use client";

import { useEffect, useRef } from "react";
import type { Container, Text } from "pixi.js";
import type { FishView } from "@/types/game";
import { createFishAgent, reactToFishClick, updateFishAgent, type FishAgent } from "@/components/aquarium/fish-ai";
import { cn } from "@/lib/cn";
import { playTone } from "@/stores/sound-store";

type PixiModule = typeof import("pixi.js");

export function AquariumRenderer({ fish, className, interactive = false }: { fish: FishView[]; className?: string; interactive?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fishRef = useRef(fish);
  fishRef.current = fish;

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      const host = hostRef.current;
      if (!host) return;
      const PIXI = await import("pixi.js");
      if (cancelled) return;

      cleanup = await createScene(PIXI, host, fishRef, interactive);
    }

    mount();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [interactive]);

  return <div ref={hostRef} className={cn("h-full min-h-[540px] w-full overflow-hidden rounded-b-[28px]", className)} />;
}

async function createScene(
  PIXI: PixiModule,
  host: HTMLDivElement,
  fishRef: React.MutableRefObject<FishView[]>,
  interactive: boolean
) {
  const app = new PIXI.Application();
  await app.init({
    resizeTo: host,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
    powerPreference: "high-performance"
  });

  host.appendChild(app.canvas);

  const background = new PIXI.Container();
  const fishLayer = new PIXI.Container();
  const labelLayer = new PIXI.Container();
  const particleLayer = new PIXI.Container();
  const world = new PIXI.Container();
  app.stage.addChild(world);
  world.addChild(background, particleLayer, fishLayer, labelLayer);

  const agents = new Map<string, { agent: FishAgent; node: Container; label: Text }>();
  const bubbles = Array.from({ length: 34 }, () => createBubble(PIXI, app.screen.width, app.screen.height));
  bubbles.forEach((bubble) => particleLayer.addChild(bubble));

  function drawBackground() {
    background.removeChildren();
    const w = app.screen.width;
    const h = app.screen.height;
    const water = new PIXI.Graphics();
    water.rect(0, 0, w, h).fill({ color: 0x06283a, alpha: 1 });
    background.addChild(water);

    for (let i = 0; i < 7; i += 1) {
      const weed = new PIXI.Graphics();
      const x = (i / 6) * w + Math.sin(i) * 18;
      weed.moveTo(x, h);
      for (let j = 0; j < 7; j += 1) {
        weed.lineTo(x + Math.sin(j + i) * 18, h - j * 22 - 18);
      }
      weed.stroke({ width: 8, color: 0x22c55e, alpha: 0.32 });
      background.addChild(weed);
    }

    const glow = new PIXI.Graphics();
    glow.circle(w * 0.2, h * 0.18, Math.max(w, h) * 0.35).fill({ color: 0x22d3ee, alpha: 0.16 });
    glow.circle(w * 0.82, h * 0.72, Math.max(w, h) * 0.22).fill({ color: 0x0ea5e9, alpha: 0.12 });
    background.addChild(glow);
  }

  function syncFish() {
    const visibleIds = new Set(fishRef.current.map((item) => item.id));
    for (const [id, entry] of agents) {
      if (!visibleIds.has(id)) {
        fishLayer.removeChild(entry.node);
        labelLayer.removeChild(entry.label);
        agents.delete(id);
      }
    }

    for (const item of fishRef.current) {
      if (agents.has(item.id)) continue;
      const agent = createFishAgent(item, app.screen.width, app.screen.height);
      const node = createFishNode(PIXI, item);
      const label = new PIXI.Text({
        text: `${item.name} · ${formatAge(item.ageSeconds)}`,
        style: {
          fontFamily: "Geist, system-ui",
          fontSize: 12,
          fill: "#e9fbff",
          align: "center",
          stroke: { color: "#031018", width: 3 }
        }
      });
      label.anchor.set(0.5);
      fishLayer.addChild(node);
      labelLayer.addChild(label);
      agents.set(item.id, { agent, node, label });
    }
  }

  function addReactionBubbles(x: number, y: number) {
    for (let i = 0; i < 8; i += 1) {
      const bubble = createBubble(PIXI, app.screen.width, app.screen.height);
      bubble.x = x + (Math.random() - 0.5) * 34;
      bubble.y = y + (Math.random() - 0.5) * 24;
      particleLayer.addChild(bubble);
      window.setTimeout(() => {
        if (!bubble.destroyed) {
          particleLayer.removeChild(bubble);
          bubble.destroy();
        }
      }, 1400);
    }
  }

  drawBackground();
  let elapsed = 0;
  app.ticker.add((ticker) => {
    const delta = ticker.deltaMS / 1000;
    elapsed += delta;
    syncFish();

    for (const entry of agents.values()) {
      updateFishAgent(entry.agent, delta, app.screen.width, app.screen.height);
      entry.node.x = entry.agent.x;
      entry.node.y = entry.agent.y;
      entry.node.scale.x = entry.agent.direction * Math.abs(entry.node.scale.x || 1);
      entry.node.rotation = Math.sin(entry.agent.phase) * 0.08;
      entry.label.x = entry.agent.x;
      entry.label.y = entry.agent.y - 42;
      entry.label.text = `${entry.agent.fish.name} · ${formatAge(entry.agent.fish.ageSeconds + elapsed)}`;
    }

    for (const bubble of bubbles) {
      bubble.y -= (0.4 + bubble.alpha) * ticker.deltaMS * 0.05;
      bubble.x += Math.sin((bubble.y + elapsed * 40) * 0.02) * 0.18;
      if (bubble.y < -20) {
        bubble.y = app.screen.height + Math.random() * 80;
        bubble.x = Math.random() * app.screen.width;
      }
    }
  });

  const onResize = () => drawBackground();
  window.addEventListener("resize", onResize);

  if (interactive) {
    let scale = 1;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    const clampWorld = () => {
      world.scale.set(scale);
      world.x = Math.min(app.screen.width * 0.3, Math.max(app.screen.width * (1 - scale) - app.screen.width * 0.3, world.x));
      world.y = Math.min(app.screen.height * 0.3, Math.max(app.screen.height * (1 - scale) - app.screen.height * 0.3, world.y));
    };
    const toWorld = (clientX: number, clientY: number) => {
      const rect = app.canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - world.x) / scale,
        y: (clientY - rect.top - world.y) / scale
      };
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      scale = Math.max(0.75, Math.min(2.5, scale + (event.deltaY > 0 ? -0.08 : 0.08)));
      clampWorld();
    };
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      startX = event.clientX;
      startY = event.clientY;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      world.x += event.clientX - lastX;
      world.y += event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      clampWorld();
    };
    const onPointerUp = (event: PointerEvent) => {
      const moved = Math.hypot(event.clientX - startX, event.clientY - startY);
      dragging = false;
      if (moved > 8) return;
      const point = toWorld(event.clientX, event.clientY);
      const entries = [...agents.values()];
      const target = entries.find((entry) => Math.hypot(entry.agent.x - point.x, entry.agent.y - point.y) < 54);
      if (target) {
        reactToFishClick(target.agent, point.x, point.y, entries.map((entry) => entry.agent));
        addReactionBubbles(target.agent.x, target.agent.y);
        playTone("fish");
      }
    };
    app.canvas.addEventListener("wheel", onWheel, { passive: false });
    app.canvas.addEventListener("pointerdown", onPointerDown);
    app.canvas.addEventListener("pointermove", onPointerMove);
    app.canvas.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("resize", onResize);
      app.canvas.removeEventListener("wheel", onWheel);
      app.canvas.removeEventListener("pointerdown", onPointerDown);
      app.canvas.removeEventListener("pointermove", onPointerMove);
      app.canvas.removeEventListener("pointerup", onPointerUp);
      app.destroy(true);
    };
  }

  return () => {
    window.removeEventListener("resize", onResize);
    app.destroy(true);
  };
}

function createFishNode(PIXI: PixiModule, fish: FishView) {
  const node = new PIXI.Container();
  const body = new PIXI.Graphics();
  const color = Number.parseInt(fish.color.replace("#", ""), 16);
  const glow = Number.parseInt(fish.glowColor.replace("#", ""), 16);

  body.ellipse(0, 0, 28, 15).fill({ color, alpha: 0.95 });
  body.circle(14, -4, 2.2).fill({ color: 0x031018, alpha: 0.95 });
  body.moveTo(-26, 0).lineTo(-48, -14).lineTo(-42, 0).lineTo(-48, 14).closePath().fill({ color, alpha: 0.75 });
  body.moveTo(-4, -13).lineTo(-16, -29).lineTo(8, -15).closePath().fill({ color: glow, alpha: 0.55 });
  body.moveTo(-2, 13).lineTo(-15, 27).lineTo(9, 15).closePath().fill({ color: glow, alpha: 0.45 });

  const aura = new PIXI.Graphics();
  const auraAlpha = fish.rarity === "LEGENDARY" ? 0.36 : fish.rarity === "EPIC" ? 0.24 : fish.rarity === "RARE" ? 0.16 : 0.08;
  aura.ellipse(0, 0, 40, 24).fill({ color: glow, alpha: auraAlpha });

  node.addChild(aura, body);
  node.scale.set(0.9 + Math.min(0.4, fish.incomePerSecond / 12));
  return node;
}

function createBubble(PIXI: PixiModule, width: number, height: number) {
  const bubble = new PIXI.Graphics();
  const radius = 2 + Math.random() * 5;
  bubble.circle(0, 0, radius).stroke({ width: 1.5, color: 0xcffafe, alpha: 0.5 });
  bubble.x = Math.random() * width;
  bubble.y = Math.random() * height;
  bubble.alpha = 0.24 + Math.random() * 0.42;
  return bubble;
}

function formatAge(ageSeconds: number) {
  const days = Math.floor(ageSeconds / 86400);
  if (days > 0) return `${days}д`;
  const hours = Math.floor(ageSeconds / 3600);
  if (hours > 0) return `${hours}ч`;
  return `${Math.max(1, Math.floor(ageSeconds / 60))}м`;
}
