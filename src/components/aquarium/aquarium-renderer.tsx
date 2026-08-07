"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Container, Text } from "pixi.js";
import type { FishView } from "@/types/game";
import { createFishAgent, reactToFishClick, updateFishAgent, type FishAgent } from "@/components/aquarium/fish-ai";
import { fishImageBySpecies } from "@/assets/aquarium-assets";
import { backgroundImageById, decorImageById } from "@/lib/app-assets";
import { cn } from "@/lib/cn";
import { playTone } from "@/stores/sound-store";

type PixiModule = typeof import("pixi.js");

export function AquariumRenderer({ fish, className, interactive = false, backgroundId = "deep-lagoon", decor = [], pollution = 0 }: { fish: FishView[]; className?: string; interactive?: boolean; backgroundId?: string; decor?: string[]; pollution?: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneBackRef = useRef<HTMLDivElement>(null);
  const fishRef = useRef(fish);
  const decorRef = useRef(decor);
  const backgroundImage = backgroundImageById[backgroundId] ?? backgroundImageById["deep-lagoon"];
  const decorImages = useMemo(() => decor.map((id) => ({ id, image: decorImageById[id] })).filter((item): item is { id: string; image: string } => Boolean(item.image)), [decor]);
  const seaweedDecor = useMemo(() => decor.filter((id) => id === "seaweed-grove" || id === "glow-seaweed"), [decor]);
  const bubbleJets = useMemo(() => decor.flatMap((id) => id === "bubble-cannon" ? [0] : id === "double-bubble-cannon" ? [1, 2] : []), [decor]);
  useEffect(() => {
    fishRef.current = fish;
  }, [fish]);

  useEffect(() => {
    decorRef.current = decor;
  }, [decor]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      const host = hostRef.current;
      if (!host) return;
      const PIXI = await import("pixi.js");
      if (cancelled) return;

      cleanup = await createScene(PIXI, host, sceneBackRef.current, fishRef, decorRef, interactive);
    }

    mount();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [interactive]);

  return (
    <div ref={hostRef} className={cn("relative h-full min-h-[540px] w-full overflow-hidden rounded-b-[28px] bg-[#031018]", className)}>
      <div
        ref={sceneBackRef}
        className="pointer-events-none absolute inset-0 z-0 origin-top-left bg-cover bg-center will-change-transform"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {seaweedDecor.length ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[-2%] z-[1] h-[28%] overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-[65%] bg-[radial-gradient(ellipse_at_center,rgba(125,220,138,.24),transparent_70%)] blur-xl" />
            {Array.from({ length: 9 }).map((_, index) => (
              <img
                key={index}
                className="absolute bottom-0 object-contain opacity-95 drop-shadow-[0_0_18px_rgba(125,220,138,.45)]"
                src={decorImageById[seaweedDecor[index % seaweedDecor.length]]}
                alt=""
                style={{
                  left: `${index * 12 - 4}%`,
                  height: `${74 + (index % 3) * 16}%`,
                  transform: `translateX(-50%) scaleX(${index % 2 ? -1 : 1})`,
                  filter: seaweedDecor.includes("glow-seaweed") ? "drop-shadow(0 0 14px rgba(125,220,138,.72)) saturate(1.2)" : undefined
                }}
              />
            ))}
          </div>
        ) : null}
        {decorImages.filter((item) => item.id !== "seaweed-grove" && item.id !== "glow-seaweed").slice(0, 8).map((item, index) => (
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
        {bubbleJets.map((jet) => (
          <div key={jet} className="pointer-events-none absolute bottom-[12%] z-[1] h-[54%] w-10" style={{ left: jet === 0 ? "72%" : jet === 1 ? "18%" : "82%" }}>
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className="aquarium-bubble-jet absolute bottom-0 rounded-full border border-cyan-100/65 bg-cyan-100/10 shadow-[0_0_12px_rgba(103,232,249,.34)]"
                style={{
                  left: String(10 + ((index * 13) % 20)) + "px",
                  width: String(5 + (index % 4)) + "px",
                  height: String(5 + (index % 4)) + "px",
                  animationDelay: String(index * 120) + "ms",
                  animationDuration: String(1800 + (index % 5) * 180) + "ms"
                }}
              />
            ))}
          </div>
        ))}
        {Array.from({ length: Math.min(80, pollution) }).map((_, index) => (
          <span
            key={index}
            className="absolute rounded-full opacity-75 animate-pulse shadow-[0_0_8px_rgba(22,32,18,.35)]"
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${12 + ((index * 19) % 76)}%`,
              backgroundColor: index % 2 ? "#263716" : "#6b4627",
              width: String(4 + (index % 4)) + "px",
              height: String(4 + (index % 4)) + "px",
              transform: `translate3d(${Math.sin(index) * 8}px, ${Math.cos(index * 1.7) * 5}px, 0)`
            }}
          />
        ))}
      </div>
    </div>
  );
}

async function createScene(
  PIXI: PixiModule,
  host: HTMLDivElement,
  sceneBack: HTMLDivElement | null,
  fishRef: React.MutableRefObject<FishView[]>,
  decorRef: React.MutableRefObject<string[]>,
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

  const agents = new Map<string, { agent: FishAgent; node: Container; label: Text; tail: Container; labelVisibleUntil: number }>();
  let nextAggroAt = 2.5 + Math.random() * 3;
  let nextSeaweedAt = 1.5 + Math.random() * 2.5;
  const bubbles = Array.from({ length: 46 }, () => createBubble(PIXI, app.screen.width, app.screen.height));
  const ambientGlows: Container[] = [];
  bubbles.forEach((bubble) => particleLayer.addChild(bubble));

  function drawBackground() {
    background.removeChildren();
    ambientGlows.length = 0;

    const tint = new PIXI.Graphics();
    tint.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x031827, alpha: 0.06 });
    background.addChild(tint);
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
      label.visible = interactive;
      fishLayer.addChild(sprite.node);
      labelLayer.addChild(label);
      agents.set(item.id, { agent, node: sprite.node, tail: sprite.tail, label, labelVisibleUntil: 0 });
    }
  }


  function addFloatingMark(text: string, x: number, y: number, color = "#e9fbff") {
    const mark = new PIXI.Text({
      text,
      style: {
        fontFamily: "Geist, system-ui",
        fontSize: 22,
        fill: color,
        align: "center",
        stroke: { color: "#031018", width: 4 }
      }
    });
    mark.anchor.set(0.5);
    mark.x = x;
    mark.y = y - 38;
    particleLayer.addChild(mark);
    const born = performance.now();
    const tick = () => {
      const life = (performance.now() - born) / 1000;
      mark.y -= 0.42;
      mark.alpha = Math.max(0, 1 - life);
      if (life >= 1 || mark.destroyed) {
        app.ticker.remove(tick);
        if (!mark.destroyed) {
          particleLayer.removeChild(mark);
          mark.destroy();
        }
      }
    };
    app.ticker.add(tick);
  }

  function emotionFor(fish: FishView) {
    if (fish.personality === "CURIOUS") return "?";
    if (fish.personality === "SHY") return "!";
    if (fish.personality === "AGGRESSIVE") return "!!";
    if (fish.personality === "PLAYFUL") return "♪";
    if (fish.personality === "SOCIAL") return "+";
    if (fish.personality === "LAZY") return "...";
    return "~";
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
    nextSeaweedAt -= delta;
    if (nextSeaweedAt <= 0 && decorRef.current.some((id) => id === "seaweed-grove" || id === "glow-seaweed")) {
      const guppies = agentList.filter((agent) => agent.fish.species === "GUPPY");
      for (const guppy of guppies.slice(0, 4)) {
        if (Math.random() < 0.7) {
          guppy.targetX = app.screen.width * (0.12 + Math.random() * 0.76);
          guppy.targetY = app.screen.height * (0.72 + Math.random() * 0.16);
          guppy.nextDecision = 1.2;
        }
      }
      nextSeaweedAt = 4 + Math.random() * 5;
    }

    nextAggroAt -= delta;
    if (nextAggroAt <= 0) {
      const angry = agentList.filter((agent) => agent.fish.personality === "AGGRESSIVE");
      if (angry.length >= 2) {
        const first = angry[Math.floor(Math.random() * angry.length)];
        const second = angry.find((agent) => agent.id !== first.id);
        if (first && second && Math.hypot(first.x - second.x, first.y - second.y) < 190) {
          addFloatingMark("!!", (first.x + second.x) / 2, (first.y + second.y) / 2, "#fb7185");
          first.targetX = second.x + (Math.random() - 0.5) * 70;
          first.targetY = second.y + (Math.random() - 0.5) * 50;
          first.burstUntil = 0.55;
          second.burstUntil = 0.45;
        }
      }
      nextAggroAt = 5 + Math.random() * 7;
    }

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
      entry.label.visible = interactive || performance.now() < entry.labelVisibleUntil;
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

  const revealFishAt = (clientX: number, clientY: number) => {
    const rect = app.canvas.getBoundingClientRect();
    const point = {
      x: (clientX - rect.left - world.x) / world.scale.x,
      y: (clientY - rect.top - world.y) / world.scale.y
    };
    const entries = [...agents.values()];
    const target = entries.find((entry) => Math.hypot(entry.agent.x - point.x, entry.agent.y - point.y) < 54);
    if (!target) return false;
    target.labelVisibleUntil = performance.now() + 3200;
    reactToFishClick(target.agent, point.x, point.y, entries.map((entry) => entry.agent));
    addReactionBubbles(target.agent.x, target.agent.y);
    addFloatingMark(emotionFor(target.agent.fish), target.agent.x, target.agent.y, target.agent.fish.personality === "AGGRESSIVE" ? "#fb7185" : target.agent.fish.glowColor);
    playTone("fish");
    return true;
  };

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
      scale = Math.max(1, Math.min(2.5, scale));
      world.scale.set(scale);

      const overflowX = Math.max(0, app.screen.width * scale - app.screen.width);
      const overflowY = Math.max(0, app.screen.height * scale - app.screen.height);
      const paddingX = Math.min(app.screen.width * 0.12, overflowX * 0.5);
      const paddingY = Math.min(app.screen.height * 0.12, overflowY * 0.5);
      world.x = Math.min(paddingX, Math.max(-overflowX - paddingX, world.x));
      world.y = Math.min(paddingY, Math.max(-overflowY - paddingY, world.y));
      if (sceneBack) sceneBack.style.transform = `translate3d(${world.x}px, ${world.y}px, 0) scale(${scale})`;
    };

    const canvasPoint = (clientX: number, clientY: number) => {
      const rect = app.canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const zoomAt = (nextScale: number, clientX: number, clientY: number) => {
      const point = canvasPoint(clientX, clientY);
      const before = {
        x: (point.x - world.x) / scale,
        y: (point.y - world.y) / scale
      };
      scale = Math.max(1, Math.min(2.5, nextScale));
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
      revealFishAt(event.clientX, event.clientY);
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
      if (sceneBack) sceneBack.style.transform = "";
      app.destroy(true);
    };
  }

  const onSimplePointerUp = (event: PointerEvent) => {
    revealFishAt(event.clientX, event.clientY);
  };
  app.canvas.addEventListener("pointerup", onSimplePointerUp);

  return () => {
    window.removeEventListener("resize", onResize);
    app.canvas.removeEventListener("pointerup", onSimplePointerUp);
    app.destroy(true);
  };
}

function createFishNode(PIXI: PixiModule, fish: FishView) {
  const node = new PIXI.Container();
  const tail = new PIXI.Container();
  const glow = Number.parseInt(fish.glowColor.replace("#", ""), 16);
  const auraAlpha = fish.rarity === "LEGENDARY" ? 0.28 : fish.rarity === "EPIC" ? 0.2 : fish.rarity === "RARE" ? 0.14 : 0.08;

  const aura = new PIXI.Graphics();
  aura.ellipse(0, 0, 70, 38).fill({ color: glow, alpha: auraAlpha * 0.22 });
  aura.ellipse(0, 0, 46, 25).fill({ color: glow, alpha: auraAlpha * 0.5 });

  const fishSprite = PIXI.Sprite.from(fishImageBySpecies[fish.species]);
  fishSprite.anchor.set(0.5);
  fishSprite.width = fish.species === "GUPPY" ? 76 : fish.species === "NEON_TETRA" ? 86 : fish.species === "DRAGON_KOI" ? 138 : 116;
  fishSprite.height = fish.species === "DRAGON_KOI" ? 104 : fishSprite.width;
  fishSprite.alpha = 1;
  fishSprite.tint = 0xffffff;

  node.addChild(aura, fishSprite);
  const scale = 1.05 + Math.min(0.32, fish.incomePerSecond / 18);
  node.scale.set(fish.species === "GUPPY" ? scale : scale);
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
