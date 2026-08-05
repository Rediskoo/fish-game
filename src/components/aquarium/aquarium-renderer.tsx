"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Container, Text } from "pixi.js";
import type { FishView } from "@/types/game";
import { createFishAgent, reactToFishClick, updateFishAgent, type FishAgent } from "@/components/aquarium/fish-ai";
import { backgroundImageById, decorImageById } from "@/lib/app-assets";
import { cn } from "@/lib/cn";
import { playTone } from "@/stores/sound-store";

type PixiModule = typeof import("pixi.js");

export function AquariumRenderer({ fish, className, interactive = false, backgroundId = "deep-lagoon", decor = [] }: { fish: FishView[]; className?: string; interactive?: boolean; backgroundId?: string; decor?: string[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fishRef = useRef(fish);
  const backgroundImage = backgroundImageById[backgroundId] ?? backgroundImageById["deep-lagoon"];
  const decorImages = useMemo(() => decor.map((id) => ({ id, image: decorImageById[id] })).filter((item): item is { id: string; image: string } => Boolean(item.image)), [decor]);
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

  return (
    <div
      ref={hostRef}
      className={cn("relative h-full min-h-[540px] w-full overflow-hidden rounded-b-[28px] bg-cover bg-center", className)}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {decorImages.slice(0, 8).map((item, index) => (
        <img
          key={`${item.id}-${index}`}
          className="pointer-events-none absolute bottom-[7%] z-[1] max-h-[22%] object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,.35)]"
          src={item.image}
          alt=""
          style={{
            left: `${8 + (index % 4) * 22}%`,
            transform: `translateX(-50%) scale(${index % 2 ? 0.86 : 1})`,
            opacity: 0.95
          }}
        />
      ))}
    </div>
  );
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

  Object.assign(app.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", zIndex: "2" });
  host.appendChild(app.canvas);

  const background = new PIXI.Container();
  const fishLayer = new PIXI.Container();
  const labelLayer = new PIXI.Container();
  const particleLayer = new PIXI.Container();
  const world = new PIXI.Container();
  app.stage.addChild(world);
  world.addChild(background, particleLayer, fishLayer, labelLayer);

  const agents = new Map<string, { agent: FishAgent; node: Container; label: Text; tail: Container }>();
  const bubbles = Array.from({ length: 46 }, () => createBubble(PIXI, app.screen.width, app.screen.height));
  const ambientGlows: Container[] = [];
  bubbles.forEach((bubble) => particleLayer.addChild(bubble));

  function drawBackground() {
    background.removeChildren();
    const w = app.screen.width;
    const h = app.screen.height;
    ambientGlows.length = 0;

    const water = new PIXI.Graphics();
    water.rect(0, 0, w, h).fill({ color: 0x031827, alpha: 0.10 });
    background.addChild(water);

    for (let i = 0; i < 5; i += 1) {
      const ray = new PIXI.Graphics();
      const x = (i + 0.5) * (w / 5);
      ray.poly([x - 16, 0, x + 16, 0, x + 115, h * 0.74, x - 92, h * 0.74]).fill({ color: 0xa5f3fc, alpha: 0.035 });
      background.addChild(ray);
    }

    for (let i = 0; i < 7; i += 1) {
      const weed = new PIXI.Graphics();
      const x = (i / 6) * w + Math.sin(i) * 18;
      weed.moveTo(x, h);
      for (let j = 0; j < 7; j += 1) {
        weed.lineTo(x + Math.sin(j + i) * 18, h - j * 22 - 18);
      }
      weed.stroke({ width: 7 + (i % 3), color: i % 2 ? 0x1fae82 : 0x22c55e, alpha: 0.38 });
      background.addChild(weed);
    }

    for (let i = 0; i < 9; i += 1) {
      const coral = new PIXI.Graphics();
      const x = (i / 8) * w + Math.sin(i * 3) * 10;
      const height = 12 + (i % 4) * 8;
      coral.circle(x, h - 7, height).fill({ color: i % 2 ? 0x7c3aed : 0xf97316, alpha: 0.22 });
      coral.circle(x + height * 0.7, h - 11, height * 0.65).fill({ color: i % 2 ? 0xc084fc : 0xfb7185, alpha: 0.17 });
      background.addChild(coral);
    }

    const glow = new PIXI.Graphics();
    glow.circle(w * 0.18, h * 0.18, Math.max(w, h) * 0.28).fill({ color: 0x22d3ee, alpha: 0.14 });
    glow.circle(w * 0.82, h * 0.70, Math.max(w, h) * 0.18).fill({ color: 0x38bdf8, alpha: 0.12 });
    glow.circle(w * 0.20, h * 0.82, Math.max(w, h) * 0.16).fill({ color: 0xfacc15, alpha: 0.14 });
    glow.circle(w * 0.70, h * 0.88, Math.max(w, h) * 0.14).fill({ color: 0xa78bfa, alpha: 0.12 });
    background.addChild(glow);
    ambientGlows.push(glow);

    for (let i = 0; i < 4; i += 1) {
      const sparkle = new PIXI.Graphics();
      const x = w * (0.18 + i * 0.2);
      const y = h * (0.48 + Math.sin(i) * 0.18);
      sparkle.circle(x, y, 2.5 + i).fill({ color: 0xcffafe, alpha: 0.38 });
      sparkle.circle(x, y, 10 + i * 3).fill({ color: 0x67e8f9, alpha: 0.06 });
      background.addChild(sparkle);
      ambientGlows.push(sparkle);
    }
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
      const sprite = createFishNode(PIXI, item);
      const label = new PIXI.Text({
        text: `${item.name} · ${formatAge(item.ageSeconds)}`,
        style: {
          fontFamily: "Geist, system-ui",
          fontSize: item.species === "GUPPY" ? 10 : 12,
          fill: "#e9fbff",
          align: "center",
          stroke: { color: "#031018", width: 3 }
        }
      });
      label.anchor.set(0.5);
      fishLayer.addChild(sprite.node);
      labelLayer.addChild(label);
      agents.set(item.id, { agent, node: sprite.node, tail: sprite.tail, label });
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

    const agentList = [...agents.values()].map((entry) => entry.agent);
    for (const entry of agents.values()) {
      updateFishAgent(entry.agent, delta, app.screen.width, app.screen.height, agentList);
      entry.node.x = entry.agent.x;
      entry.node.y = entry.agent.y;
      entry.node.scale.x = entry.agent.direction * Math.abs(entry.node.scale.x || 1);
      entry.node.rotation = Math.sin(entry.agent.phase) * 0.08;
      entry.tail.rotation = Math.sin(entry.agent.phase * 2.5) * 0.17;
      entry.tail.scale.y = 0.9 + Math.abs(Math.sin(entry.agent.phase * 2.5)) * 0.2;
      entry.label.x = entry.agent.x;
      entry.label.y = entry.agent.y - (entry.agent.fish.species === "GUPPY" ? 23 : 42);
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

    for (let index = 0; index < ambientGlows.length; index += 1) {
      ambientGlows[index].alpha = 0.78 + Math.sin(elapsed * 1.2 + index) * 0.16;
    }
  });

  const onResize = () => drawBackground();
  window.addEventListener("resize", onResize);

  if (interactive) {
    host.style.touchAction = "none";

    let scale = 1;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    const pointers = new Map<number, { x: number; y: number }>();

    const clampWorld = () => {
      scale = Math.max(1, Math.min(3, scale));
      world.scale.set(scale);

      const overflowX = Math.max(0, app.screen.width * scale - app.screen.width);
      const overflowY = Math.max(0, app.screen.height * scale - app.screen.height);
      const paddingX = Math.min(app.screen.width * 0.12, overflowX * 0.5);
      const paddingY = Math.min(app.screen.height * 0.12, overflowY * 0.5);
      world.x = Math.min(paddingX, Math.max(-overflowX - paddingX, world.x));
      world.y = Math.min(paddingY, Math.max(-overflowY - paddingY, world.y));
    };

    const canvasPoint = (clientX: number, clientY: number) => {
      const rect = app.canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const toWorld = (clientX: number, clientY: number) => {
      const point = canvasPoint(clientX, clientY);
      return {
        x: (point.x - world.x) / scale,
        y: (point.y - world.y) / scale
      };
    };

    const zoomAt = (nextScale: number, clientX: number, clientY: number) => {
      const point = canvasPoint(clientX, clientY);
      const before = {
        x: (point.x - world.x) / scale,
        y: (point.y - world.y) / scale
      };
      scale = Math.max(1, Math.min(3, nextScale));
      world.x = point.x - before.x * scale;
      world.y = point.y - before.y * scale;
      clampWorld();
    };

    const pointerPair = () => [...pointers.values()].slice(0, 2);
    const pointerDistance = () => {
      const pair = pointerPair();
      if (pair.length < 2) return 0;
      return Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
    };
    const pointerCenter = () => {
      const pair = pointerPair();
      return {
        x: pair.reduce((sum, point) => sum + point.x, 0) / pair.length,
        y: pair.reduce((sum, point) => sum + point.y, 0) / pair.length
      };
    };

    const onResizeInteractive = () => clampWorld();
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(scale * (event.deltaY > 0 ? 0.9 : 1.1), event.clientX, event.clientY);
    };
    const onPointerDown = (event: PointerEvent) => {
      app.canvas.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;
      if (pointers.size === 2) {
        pinchStartDistance = pointerDistance();
        pinchStartScale = scale;
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size >= 2) {
        const center = pointerCenter();
        const distance = pointerDistance();
        if (pinchStartDistance > 0) zoomAt(pinchStartScale * (distance / pinchStartDistance), center.x, center.y);
        return;
      }

      world.x += event.clientX - lastX;
      world.y += event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      clampWorld();
    };
    const onPointerUp = (event: PointerEvent) => {
      const moved = Math.hypot(event.clientX - startX, event.clientY - startY);
      pointers.delete(event.pointerId);
      app.canvas.releasePointerCapture?.(event.pointerId);
      if (pointers.size < 2) {
        pinchStartDistance = 0;
        pinchStartScale = scale;
      }
      if (moved > 8 || pointers.size > 0) return;
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
    app.canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", onResizeInteractive);
    return () => {
      host.style.touchAction = "";
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResizeInteractive);
      app.canvas.removeEventListener("wheel", onWheel);
      app.canvas.removeEventListener("pointerdown", onPointerDown);
      app.canvas.removeEventListener("pointermove", onPointerMove);
      app.canvas.removeEventListener("pointerup", onPointerUp);
      app.canvas.removeEventListener("pointercancel", onPointerUp);
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
  const shine = new PIXI.Graphics();
  const markings = new PIXI.Graphics();
  const belly = new PIXI.Graphics();
  const fins = new PIXI.Graphics();
  const tail = new PIXI.Container();
  const tailShape = new PIXI.Graphics();
  const tailShine = new PIXI.Graphics();
  const color = Number.parseInt(fish.color.replace("#", ""), 16);
  const glow = Number.parseInt(fish.glowColor.replace("#", ""), 16);
  const auraAlpha = fish.rarity === "LEGENDARY" ? 0.52 : fish.rarity === "EPIC" ? 0.36 : fish.rarity === "RARE" ? 0.25 : 0.15;

  const aura = new PIXI.Graphics();
  aura.ellipse(0, 0, 68, 40).fill({ color: glow, alpha: auraAlpha * 0.32 });
  aura.ellipse(0, 0, 48, 28).fill({ color: glow, alpha: auraAlpha });

  const eye = new PIXI.Graphics();
  const eyeX = fish.species === "DRAGON_KOI" ? 22 : 17;
  eye.circle(eyeX, -5, 3.2).fill({ color: 0x04111b, alpha: 0.96 });
  eye.circle(eyeX + 1, -6, 0.85).fill({ color: 0xffffff, alpha: 0.9 });

  if (fish.species === "ANGELFISH") {
    body.poly([-22, 0, -7, -34, 22, 0, -7, 34]).fill({ color, alpha: 0.97 });
    belly.poly([-12, 0, -4, 22, 15, 0, -4, -22]).fill({ color: 0xffffff, alpha: 0.18 });
    tailShape.poly([-15, 0, -43, -25, -35, 0, -43, 25]).fill({ color: glow, alpha: 0.78 });
    tailShine.poly([-28, 0, -42, -16, -37, 0, -42, 16]).fill({ color: 0xffffff, alpha: 0.16 });
    fins.moveTo(-1, -19).lineTo(-9, -46).lineTo(11, -18).fill({ color: glow, alpha: 0.62 });
    fins.moveTo(-1, 19).lineTo(-9, 46).lineTo(11, 18).fill({ color: glow, alpha: 0.48 });
    markings.moveTo(-2, -25).lineTo(-2, 25).stroke({ width: 2.2, color: glow, alpha: 0.52 });
  } else if (fish.species === "DISCUS") {
    body.circle(0, 0, 25).fill({ color, alpha: 0.97 });
    belly.ellipse(8, 2, 15, 19).fill({ color: 0xffffff, alpha: 0.13 });
    tailShape.poly([-21, 0, -45, -17, -38, 0, -45, 17]).fill({ color: glow, alpha: 0.72 });
    for (let x = -12; x <= 12; x += 8) markings.rect(x, -22, 3, 44).fill({ color: x === 4 ? 0xffffff : glow, alpha: x === 4 ? 0.2 : 0.38 });
    fins.ellipse(-4, -20, 13, 6).fill({ color: glow, alpha: 0.42 });
    fins.ellipse(-4, 20, 13, 6).fill({ color: glow, alpha: 0.34 });
  } else if (fish.species === "BETTA") {
    body.ellipse(0, 0, 28, 14).fill({ color, alpha: 0.97 });
    belly.ellipse(9, 3, 14, 7).fill({ color: 0xffffff, alpha: 0.14 });
    tailShape.poly([-20, 0, -58, -29, -45, 0, -58, 29]).fill({ color: glow, alpha: 0.78 });
    tailShine.poly([-31, 0, -56, -18, -48, 0, -56, 18]).fill({ color: 0xffffff, alpha: 0.13 });
    fins.poly([-8, -10, -29, -37, 14, -16]).fill({ color: glow, alpha: 0.66 });
    fins.poly([-8, 10, -29, 37, 14, 16]).fill({ color: glow, alpha: 0.55 });
    markings.ellipse(3, 0, 22, 8).stroke({ width: 2, color: 0xffffff, alpha: 0.14 });
  } else if (fish.species === "DRAGON_KOI") {
    body.ellipse(0, 0, 39, 15).fill({ color, alpha: 0.98 });
    belly.ellipse(13, 4, 21, 7).fill({ color: 0xffffff, alpha: 0.16 });
    tailShape.poly([-31, 0, -59, -20, -50, 0, -59, 20]).fill({ color: glow, alpha: 0.8 });
    fins.moveTo(-8, -12).lineTo(6, -32).lineTo(16, -12).fill({ color: glow, alpha: 0.68 });
    fins.moveTo(-8, 12).lineTo(6, 32).lineTo(16, 12).fill({ color: glow, alpha: 0.48 });
    for (let x = -18; x <= 15; x += 11) markings.circle(x, Math.sin(x) * 4, 3.2).fill({ color: glow, alpha: 0.55 });
    markings.moveTo(28, 2).lineTo(45, 13).stroke({ width: 1.5, color: glow, alpha: 0.78 });
  } else if (fish.species === "MANDARINFISH") {
    body.ellipse(0, 0, 31, 16).fill({ color, alpha: 0.97 });
    belly.ellipse(8, 4, 14, 8).fill({ color: 0xffffff, alpha: 0.12 });
    tailShape.poly([-25, 0, -50, -18, -43, 0, -50, 18]).fill({ color: glow, alpha: 0.78 });
    for (let i = -14; i <= 14; i += 7) markings.circle(i, Math.sin(i) * 5, 2.8).fill({ color: glow, alpha: 0.86 });
    markings.moveTo(-20, -7).lineTo(20, 5).stroke({ width: 2, color: 0xffffff, alpha: 0.16 });
    fins.moveTo(-4, -14).lineTo(-16, -31).lineTo(13, -14).fill({ color: glow, alpha: 0.62 });
  } else if (fish.species === "NEON_TETRA") {
    body.ellipse(0, 0, 31, 11).fill({ color, alpha: 0.97 });
    belly.ellipse(8, 3, 16, 5).fill({ color: 0xffffff, alpha: 0.14 });
    tailShape.poly([-28, 0, -49, -12, -43, 0, -49, 12]).fill({ color: glow, alpha: 0.76 });
    markings.rect(-22, -3, 43, 5).fill({ color: glow, alpha: 0.9 });
    markings.rect(-18, 3, 30, 3).fill({ color: 0xfb7185, alpha: 0.7 });
  } else if (fish.species === "GOLDFISH") {
    body.ellipse(0, 0, 30, 19).fill({ color, alpha: 0.97 });
    belly.ellipse(10, 5, 17, 9).fill({ color: 0xffffff, alpha: 0.15 });
    tailShape.poly([-25, 0, -50, -28, -43, 0, -50, 28]).fill({ color: glow, alpha: 0.77 });
    tailShine.poly([-34, 0, -49, -18, -43, 0, -49, 18]).fill({ color: 0xffffff, alpha: 0.13 });
    fins.poly([-7, -15, -19, -32, 14, -15]).fill({ color: glow, alpha: 0.58 });
    markings.arc(4, 0, 18, -0.65, 0.65).stroke({ width: 2, color: 0xffffff, alpha: 0.12 });
  } else {
    body.ellipse(0, 0, 29, 14).fill({ color, alpha: 0.97 });
    belly.ellipse(9, 3, 15, 7).fill({ color: 0xffffff, alpha: 0.14 });
    tailShape.poly([-25, 0, -49, -16, -43, 0, -49, 16]).fill({ color: glow, alpha: 0.76 });
    fins.poly([-4, -12, -17, -28, 11, -14]).fill({ color: glow, alpha: 0.58 });
    markings.circle(6, 0, 3).fill({ color: glow, alpha: 0.5 });
  }

  shine.ellipse(6, -7, 17, 5).fill({ color: 0xffffff, alpha: 0.18 });
  shine.circle(17, -9, 2.6).fill({ color: 0xffffff, alpha: 0.13 });

  tail.addChild(tailShape, tailShine);
  node.addChild(aura, tail, fins, body, belly, markings, shine, eye);
  const scale = 0.9 + Math.min(0.42, fish.incomePerSecond / 12);
  node.scale.set(fish.species === "GUPPY" ? scale / 3 : scale);
  return { node, tail };
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
